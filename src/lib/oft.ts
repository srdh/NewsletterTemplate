/*
 * Builds a real Outlook template (.oft) in the browser.
 *
 * An .oft is an Outlook message file (MS-OXMSG): a Compound File whose root
 * storage carries the Outlook template class id, with the message properties
 * (subject, HTML body, plain-text body, "unsent" flag) stored as MAPI
 * properties. Classic Outlook for Windows opens it as a template: File >
 * Open > Outlook Template, or double-click the file.
 *
 * Images travel inside the file as hidden attachments. The HTML points at
 * them with cid: links, so they show in the email with no hosting needed.
 */

type CfbModule = typeof import('cfb')

/** {0006F046-0000-0000-C000-000000000046}, byte order as stored on disk. */
const OUTLOOK_TEMPLATE_CLSID = '46f0060000000000c000000000000046'

const PT_LONG = 0x0003
const PT_BOOLEAN = 0x000b
const PT_SYSTIME = 0x0040
const PT_UNICODE = 0x001f
const PT_BINARY = 0x0102

const PR_IMPORTANCE = 0x0017
const PR_MESSAGE_CLASS = 0x001a
const PR_SUBJECT = 0x0037
const PR_MESSAGE_FLAGS = 0x0e07
const PR_HASATTACH = 0x0e1b
const PR_NORMALIZED_SUBJECT = 0x0e1d
const PR_BODY = 0x1000
const PR_HTML = 0x1013
const PR_NATIVE_BODY_INFO = 0x1016
const PR_CREATION_TIME = 0x3007
const PR_LAST_MODIFICATION_TIME = 0x3008
const PR_STORE_SUPPORT_MASK = 0x340d
const PR_INTERNET_CPID = 0x3fde
const PR_MESSAGE_CODEPAGE = 0x3ffd

const PR_ATTACH_SIZE = 0x0e20
const PR_ATTACH_NUM = 0x0e21
const PR_OBJECT_TYPE = 0x0ffe
const PR_DISPLAY_NAME = 0x3001
const PR_ATTACH_DATA_BIN = 0x3701
const PR_ATTACH_EXTENSION = 0x3703
const PR_ATTACH_FILENAME = 0x3704
const PR_ATTACH_METHOD = 0x3705
const PR_ATTACH_LONG_FILENAME = 0x3707
const PR_RENDERING_POSITION = 0x370b
const PR_ATTACH_MIME_TAG = 0x370e
const PR_ATTACH_CONTENT_ID = 0x3712
const PR_ATTACH_FLAGS = 0x3714
const PR_ATTACHMENT_HIDDEN = 0x7ffe

const ATTACH_BY_VALUE = 1
const ATT_MHTML_REF = 4
const MAPI_ATTACH = 7

const MSGFLAG_UNSENT = 0x8
const STORE_UNICODE_OK = 0x00040000
const NATIVE_BODY_HTML = 3
const CODEPAGE_UTF8 = 65001

/** Readable and writable, as Outlook writes its own properties. */
const PROP_FLAGS = 0x00000006

type Prop =
  | { id: number; type: typeof PT_LONG; value: number }
  | { id: number; type: typeof PT_BOOLEAN; value: boolean }
  | { id: number; type: typeof PT_SYSTIME; value: Date }
  | { id: number; type: typeof PT_UNICODE; value: string }
  | { id: number; type: typeof PT_BINARY; value: Uint8Array }

/** An image embedded in the email, referenced in the HTML as cid:contentId. */
export type OftImage = {
  contentId: string
  filename: string
  mime: string
  bytes: Uint8Array
}

export type OftContent = {
  subject: string
  html: string
  text: string
  images?: OftImage[]
  created?: Date
}

function hex4(value: number): string {
  return value.toString(16).toUpperCase().padStart(4, '0')
}

function utf16le(value: string): Uint8Array {
  const out = new Uint8Array(value.length * 2)
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i)
    out[i * 2] = code & 0xff
    out[i * 2 + 1] = code >> 8
  }
  return out
}

/** Windows FILETIME: 100-nanosecond ticks since January 1, 1601 (UTC). */
function filetime(date: Date): bigint {
  return (BigInt(date.getTime()) + 11644473600000n) * 10000n
}

/**
 * Writes a "__properties_version1.0" stream plus one "__substg1.0_XXXXYYYY"
 * stream per variable-length property. `header` is the fixed header that
 * starts the stream: 32 bytes for the message, 8 for an attachment.
 */
function writeProperties(
  props: Prop[],
  header: Uint8Array,
): { table: Uint8Array; streams: Map<string, Uint8Array> } {
  const HEADER = header.length
  const table = new Uint8Array(HEADER + props.length * 16)
  table.set(header, 0)
  const view = new DataView(table.buffer)
  const streams = new Map<string, Uint8Array>()

  props.forEach((prop, index) => {
    const at = HEADER + index * 16
    view.setUint32(at, ((prop.id << 16) | prop.type) >>> 0, true)
    view.setUint32(at + 4, PROP_FLAGS, true)
    const name = `__substg1.0_${hex4(prop.id)}${hex4(prop.type)}`
    switch (prop.type) {
      case PT_LONG:
        view.setInt32(at + 8, prop.value, true)
        break
      case PT_BOOLEAN:
        view.setUint16(at + 8, prop.value ? 1 : 0, true)
        break
      case PT_SYSTIME:
        view.setBigUint64(at + 8, filetime(prop.value), true)
        break
      case PT_UNICODE: {
        const bytes = utf16le(prop.value)
        // Size counts the two-byte terminator that the stream itself omits.
        view.setUint32(at + 8, bytes.length + 2, true)
        streams.set(name, bytes)
        break
      }
      case PT_BINARY:
        view.setUint32(at + 8, prop.value.length, true)
        streams.set(name, prop.value)
        break
    }
  })
  return { table, streams }
}

/** Builds the .oft bytes. `cfb` is passed in so it can be loaded on demand. */
export function buildOft(CFB: CfbModule, content: OftContent): Uint8Array {
  const created = content.created ?? new Date()
  const props: Prop[] = [
    { id: PR_MESSAGE_CLASS, type: PT_UNICODE, value: 'IPM.Note' },
    { id: PR_SUBJECT, type: PT_UNICODE, value: content.subject },
    { id: PR_NORMALIZED_SUBJECT, type: PT_UNICODE, value: content.subject },
    { id: PR_BODY, type: PT_UNICODE, value: content.text },
    { id: PR_HTML, type: PT_BINARY, value: new TextEncoder().encode(content.html) },
    { id: PR_NATIVE_BODY_INFO, type: PT_LONG, value: NATIVE_BODY_HTML },
    { id: PR_INTERNET_CPID, type: PT_LONG, value: CODEPAGE_UTF8 },
    { id: PR_MESSAGE_CODEPAGE, type: PT_LONG, value: CODEPAGE_UTF8 },
    { id: PR_MESSAGE_FLAGS, type: PT_LONG, value: MSGFLAG_UNSENT },
    { id: PR_STORE_SUPPORT_MASK, type: PT_LONG, value: STORE_UNICODE_OK },
    { id: PR_IMPORTANCE, type: PT_LONG, value: 1 },
    // Inline images are hidden attachments; Outlook does not show a paperclip.
    { id: PR_HASATTACH, type: PT_BOOLEAN, value: false },
    { id: PR_CREATION_TIME, type: PT_SYSTIME, value: created },
    { id: PR_LAST_MODIFICATION_TIME, type: PT_SYSTIME, value: created },
  ]

  const images = content.images ?? []

  // Top-level header (MS-OXMSG 2.4.1.1): reserved, next recipient id,
  // next attachment id, recipient count, attachment count, reserved.
  const header = new Uint8Array(32)
  const headerView = new DataView(header.buffer)
  headerView.setUint32(12, images.length, true)
  headerView.setUint32(20, images.length, true)

  const { table, streams } = writeProperties(props, header)
  const doc = CFB.utils.cfb_new({ CLSID: OUTLOOK_TEMPLATE_CLSID })
  CFB.utils.cfb_add(doc, '/__properties_version1.0', table)
  for (const [name, bytes] of streams) CFB.utils.cfb_add(doc, `/${name}`, bytes)

  images.forEach((image, index) => {
    const folder = `/__attach_version1.0_#${index.toString(16).toUpperCase().padStart(8, '0')}`
    const extension = image.filename.includes('.') ? image.filename.slice(image.filename.lastIndexOf('.')) : ''
    const attachProps: Prop[] = [
      { id: PR_ATTACH_METHOD, type: PT_LONG, value: ATTACH_BY_VALUE },
      { id: PR_ATTACH_DATA_BIN, type: PT_BINARY, value: image.bytes },
      { id: PR_ATTACH_SIZE, type: PT_LONG, value: image.bytes.length },
      { id: PR_ATTACH_NUM, type: PT_LONG, value: index },
      { id: PR_OBJECT_TYPE, type: PT_LONG, value: MAPI_ATTACH },
      { id: PR_DISPLAY_NAME, type: PT_UNICODE, value: image.filename },
      { id: PR_ATTACH_FILENAME, type: PT_UNICODE, value: image.filename },
      { id: PR_ATTACH_LONG_FILENAME, type: PT_UNICODE, value: image.filename },
      { id: PR_ATTACH_EXTENSION, type: PT_UNICODE, value: extension },
      { id: PR_ATTACH_MIME_TAG, type: PT_UNICODE, value: image.mime },
      { id: PR_ATTACH_CONTENT_ID, type: PT_UNICODE, value: image.contentId },
      { id: PR_ATTACH_FLAGS, type: PT_LONG, value: ATT_MHTML_REF },
      { id: PR_RENDERING_POSITION, type: PT_LONG, value: -1 },
      { id: PR_ATTACHMENT_HIDDEN, type: PT_BOOLEAN, value: true },
    ]
    const attach = writeProperties(attachProps, new Uint8Array(8))
    CFB.utils.cfb_add(doc, `${folder}/__properties_version1.0`, attach.table)
    for (const [name, bytes] of attach.streams) CFB.utils.cfb_add(doc, `${folder}/${name}`, bytes)
  })

  // Named-property map. Required even when no named properties are used.
  for (const stream of ['00020102', '00030102', '00040102']) {
    CFB.utils.cfb_add(doc, `/__nameid_version1.0/__substg1.0_${stream}`, new Uint8Array(0))
  }

  const written = CFB.write(doc, { type: 'array' }) as ArrayLike<number>
  return written instanceof Uint8Array ? written : Uint8Array.from(written)
}
