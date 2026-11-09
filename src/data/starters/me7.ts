import type { CampaignBundle } from '../../types'
import { PRIVACY_URL, writeDesign, type BodyBlock, type InnerBlock, type NewsletterDesign } from '../../lib/newsletter'
import { emptyCampaign } from '../seed'
import { ME7_FOOTER_LOGO, ME7_HERO, ME7_SALES_TITAN, ME7_TECH_TITAN } from './me7Images'

/*
 * "Find the right ME7 + Copilot and AI Consumption learning path for you!"
 * rebuilt as a Newsletter studio design from the original Outlook template:
 * grey email body, Microsoft logo and hero art, bordered cards for each
 * learning path, Titan badge rows, a dark "what's coming next" band, and the
 * Redmond footer. Every part stays editable in the studio.
 */

const GREEN = '#07641D'
const LIME = '#D4EC8E'
const TEAL_ROW = '#B9DCD2'
const NEW_TAG = '<strong><span style="background-color:#00FFFF">NEW</span></strong>'

function id(): string {
  return crypto.randomUUID()
}

const text = (html: string): InnerBlock => ({ id: id(), kind: 'text', html })
const button = (label: string, url: string, color = GREEN): InnerBlock => ({
  id: id(),
  kind: 'button',
  label,
  url,
  align: 'left',
  color,
})
const card = (items: InnerBlock[]): BodyBlock => ({ id: id(), kind: 'card', border: LIME, background: '#FFFFFF', items })
const newItem = (title: string, url: string) => `<p>${NEW_TAG} ${title}<br><a href="${url}">Register now</a></p>`

export function me7Starter(): CampaignBundle {
  const design: NewsletterDesign = {
    version: 1,
    style: { accent: GREEN, canvas: '#FFFFFF', paper: '#F4F3F5', link: '#4AA647', font: 'Aptos', size: 15, frame: '', width: 640 },
    banner: {
      layout: 'image',
      align: 'left',
      background: '#194449',
      text: '#FFFFFF',
      // The hero artwork carries the Microsoft logo itself.
      showMark: false,
      logo: '',
      rightLogo: '',
      dateLabel: '',
      imageAlt: 'Banner: ME7 + Copilot and AI Consumption Skilling - Find the learning path that is right for you',
      logoBar: false,
    },
    blocks: [
      text(
        '<h3>Build the skills for what’s next: ME7 + Copilot and AI Consumption Skilling</h3>' +
          '<p>Microsoft AI skilling is evolving to help partners build the capabilities needed to lead customers through AI transformation—from everyday productivity and advanced agentic AI to security, agent management, consumption, and financial optimization:</p>' +
          '<ul>' +
          '<li><strong>Hero (ME7 + Consumption):</strong> Help customers unlock the value of Microsoft 365 E7 and Agent 365 to adopt AI agents, transform how work gets done, and become Frontier-ready.</li>' +
          '<li><strong>Frontier Workforce</strong>: Build skills across Everyday AI and Advanced AI, including Microsoft 365 Copilot, Copilot Cowork, agents, Copilot Code, and automation.</li>' +
          '<li><strong>Secure the Frontier</strong>: Help customers securely adopt and scale AI with Microsoft 365 E7-aligned security, governance, and Responsible AI practices.</li>' +
          '<li><strong>Agent Management</strong>: Develop the skills to manage, monitor, and govern AI agents using Agent 365 capabilities, observability, and operational controls.</li>' +
          '<li><strong>AI Economics &amp; FinOps</strong>: Help customers understand AI consumption, pricing, credits, forecasting, cost controls, and financial optimization—connecting AI investments to measurable business value.</li>' +
          '<li><strong>Partner Sales Acceleration</strong>: Build the skills to position Microsoft AI solutions, communicate business value, identify opportunities, and guide customers from initial adoption to expansion.</li>' +
          '</ul>' +
          '<p><strong>Find the learning path that fits your role.</strong> Start with focused Microskilling, build proficiency through role-based Learning Journeys, and advance your expertise through hands-on experiences and Titan Journeys.</p>',
      ),
      button(
        'Explore Microsoft AI Skilling',
        'https://www.skilling-hub.com/en-US/search?taxonomies=solution-area%3A%3Aai-business-solutions%2Csolution-area%3A%3Asecurity',
        LIME,
      ),
      text('<p><strong>AI-focused microskilling</strong> gives you fast, focused learning on specific Copilot and Cowork topics in just a few minutes.</p>'),
      card([
        text(
          '<h3>Microskilling Courses</h3>' +
            '<ul>' +
            '<li><strong><a href="https://www.skilling-hub.com/en-US/listing/mm:fy26-apr21-microsoft-me7-vision">Microsoft ME7 Vision</a></strong><br>Build a Frontier Firm, powered by AI and driven by humans, with the Microsoft 365 E7 Frontier Suite.</li>' +
            '<li><strong><a href="https://aka.ms/MicroSkillingCowork">Copilot Cowork Microskilling</a></strong><br>Choose your topic from the entire library of fast, focused learning.</li>' +
            '<li><strong><a href="https://aka.ms/MicroSkillingCopilotTrial">Copilot in 30 Trial</a></strong><br>Get quick advice on running a trial that helps your prospect quickly discover the value of Copilot Cowork.</li>' +
            '<li><strong><a href="https://aka.ms/MicroskillingASPX">ASPX Microskilling</a></strong><br>Get a unified view of customer usage, licensing, and growth insights to uncover opportunities, increase adoption, and drive business success.</li>' +
            '<li><strong><a href="https://aka.ms/MicroskillingUBB">Copilot Usage-Based Billing (UBB)</a></strong><br>Get quick insight into Copilot usage-based billing, including consumption, invoicing, reseller charges, tracking, and incentives.</li>' +
            '</ul>',
        ),
        button('Find the Latest with Microskillings', 'https://aka.ms/microskilling'),
      ]),
      text(
        '<h3>Proficient Learning Journeys</h3>' +
          '<p>Ready to go deeper? Follow a role-based <strong>Learning Journey</strong>. Build role-based proficiency through curated Learning Journeys designed to help you sell, design, deploy, secure, and manage Microsoft AI solutions.</p>',
      ),
      card([
        text(
          '<p><span style="font-size:18px">Sales Ready</span></p>' +
            '<p><strong>Build the skills to lead AI transformation and consumption conversations</strong>. Develop the skills to position Microsoft 365 E7, Copilot, and agentic AI solutions, communicate customer value, identify opportunities, and guide conversations around AI adoption, consumption, and financial outcomes.</p>',
        ),
        button('Start your Cowork Sales Ready journey', 'https://aka.ms/CoworkSalesReadyLearningJourney'),
        text(
          newItem('Cowork Cost Estimator', 'https://skilling-hub.com/en-US/listing/l::2478685') +
            newItem(
              'Microsoft 365 Copilot Selling Copilot Cowork: From Productivity to Business Impact',
              'https://skilling-hub.com/en-US/listing/l::2478685',
            ),
        ),
        button('Start your Agent 365 and Microsoft 365 E7 Sales Ready journey', 'https://skillupwithlevelup.com/journeys/50'),
      ]),
      card([
        text(
          '<p><span style="font-size:18px">Project Ready</span></p>' +
            '<p><strong>Build the skills to deploy govern and optimize Microsoft AI solutions</strong>. Develop the technical expertise to implement Copilot and Cowork, support successful deployments, and help customers securely adopt and realize value from their AI investments.</p>',
        ),
        button('Start your Cowork Project Ready journey', 'https://aka.ms/CoworkProjectReadyLearningJourney'),
        text(
          newItem('AI Models in Microsoft Copilot', 'https://skilling-hub.com/en-US/listing/on::01258::092026::pr::ai-models-in-ms-365-cop') +
            newItem(
              'Copilot Usage Based Billing Cost Management',
              'https://skilling-hub.com/en-US/listing/on::01260::092026::pr::copilot-usage-based-bil',
            ),
        ),
        button(
          'Start your Agent 365 and Microsoft 365 E7 Project Ready journey',
          'https://catalog.skillupwithlevelup.com/journeys/e7ae20e3-b40e-466e-9a1e-8ded585b20d9',
        ),
      ]),
      text(
        '<p>Put Your AI Skills into Practice in an <strong>In-Person Workshop.</strong></p>' +
          '<p><strong>Build practical experience</strong> applying Copilot Cowork &amp; Copilot Studio, and Microsoft Agent 365 &amp; ME7 to real-world scenarios and develop the confidence to bring agentic AI solutions to your customers.</p>',
      ),
      card([
        text(
          '<h3>Copilot Cowork &amp; Copilot Studio Workshop</h3>' +
            '<p>Guided, practical workshops, where you build experience applying Copilot Cowork and Copilot Studio <strong>to real-world scenarios</strong> and develop the confidence to bring these capabilities to your customers.</p>',
        ),
        button(
          'Find a Hands-on Workshop',
          'https://www.skilling-hub.com/en-US/search?search=%22Drive+agentic+AI+conversations+with+Copilot+Cowork%22&taxonomies=target-audience%3A%3Atech-deal-ready%2Ctarget-audience%3A%3Aproject-ready',
        ),
        text(
          '<h3>Microsoft Agent 365 &amp; ME7 Workshop</h3>' +
            '<p>Guided, practical workshops, where you build experience applying Microsoft Agent 365 &amp; ME7 <strong>to real-world scenarios</strong> and develop the confidence to bring these capabilities to your customers.</p>',
        ),
        button('Find a Hands-on Workshop', 'https://www.skilling-hub.com/en-US/program/regional-workshops?taxonomies=solution-area::security'),
      ]),
      text(
        '<h3>Titan Journeys</h3>' +
          '<p><strong>Go deeper with role-based AI learning.</strong> Deepen your expertise in Microsoft AI solutions, strengthen your ability to support customer transformation, and build specialized sales and technical capabilities.</p>',
      ),
      {
        id: id(),
        kind: 'media',
        src: ME7_SALES_TITAN,
        alt: 'Microsoft Sales TITAN badge',
        imageWidth: 120,
        background: TEAL_ROW,
        border: GREEN,
        html:
          '<p>Choose from Sales Ready Titan Journeys including:</p>' +
          '<ul><li><strong>M365 Copilot and Agents</strong></li><li><strong>Secure AI &amp; Agents with Agent 365 and Microsoft 365 E7</strong></li><li>Threat Protection</li><li>Transform AI with Business Central</li><li>Azure: Migrate and Modernize</li></ul>',
      },
      {
        id: id(),
        kind: 'media',
        src: ME7_TECH_TITAN,
        alt: 'Microsoft Tech TITAN badge',
        imageWidth: 120,
        background: TEAL_ROW,
        border: GREEN,
        html:
          '<p>Pursue a Tech badge with Titan Journeys including:</p>' +
          '<ul><li><strong>Microsoft 365 Copilot &amp; Agents</strong></li><li><strong>Agentic AI Solutions with Copilot Studio</strong></li><li><strong>Data Security</strong></li><li>Microsoft 365 E7 - The Frontier Suite <em>(coming soon)</em></li><li>Agent 365 - The control plane for AI agents <em>(coming soon)</em></li><li>Agentic AI Solutions on Microsoft Foundry</li></ul>' +
          '<p>and more!</p>',
      },
      text('<p><a href="https://skillupwithlevelup.com/titan">Start your Titan Journey today!</a></p>'),
      {
        id: id(),
        kind: 'section',
        background: '#194449',
        text: '#FFFFFF',
        link: '#6FC040',
        html:
          '<h3>What’s coming next in ME7 + Copilot and AI Consumption Skilling</h3>' +
          '<p>As Microsoft 365 E7, Agent 365 and Copilot Cowork capabilities evolve, so do customer uses and expectations. Beyond understanding what AI can do, customers increasingly want to understand what it will cost, how to manage consumption, and how to measure the return on their AI investments.</p>' +
          '<p><strong>New &amp; Refreshed Microskilling</strong><br>Keep an eye out for topics across:</p>' +
          '<ul><li>Microsoft 365 E7 Frontier Suite</li><li>Copilot &amp; Cowork experiences</li><li>Copilot Code &amp; Work IQ</li><li>Agents &amp; emerging Copilot capabilities</li><li>Security, governance &amp; Responsible AI</li><li>Agent 365: observing, governing, and securing agents</li><li>Copilot Credits &amp; cost estimation</li><li>Consumption, cost management &amp; FinOps</li><li>Agentic AI</li></ul>' +
          '<p><strong>Updated Titan Journeys</strong><br><strong>Sales Ready Titan</strong><br>Additional coverage of:</p>' +
          '<ul><li>Microsoft 365 E7 positioning and upgrade conversations</li><li>Latest Copilot capabilities</li><li>Agent 365 and agent governance value</li><li>UBB and consumption conversations</li><li>Licensing, cost estimation and commercial considerations</li><li>AI value and customer outcomes</li></ul>' +
          '<p><strong>Project Ready Titan</strong><br>Additional coverage of:</p>' +
          '<ul><li>Microsoft 365 E7 and Agent 365 deployment</li><li>Copilot implementation</li><li>Agent observability, governance, security and optimization</li><li>Consumption and billing</li><li>Cost management and FinOps</li></ul>' +
          '<p><strong>New Pre-sales Hackathons</strong><br>Apply the learning through hands-on customer scenarios focused on:</p>' +
          '<ul><li>Microsoft 365 E7 &amp; Agent 365</li><li>Copilot Cowork &amp; Copilot Studio</li><li>Securing and governing AI agents</li><li>AI consumption, cost, and adoption</li><li>Customer opportunity discovery</li><li>Value realization and business outcomes</li></ul>' +
          '<p>Stay up to date with live and on-demand skilling through the <a href="https://aka.ms/AA11syjo">Partner Skilling Hub</a>.</p>',
      },
    ],
    footer: {
      background: '#E8E6DF',
      text: '#242424',
      html:
        `<p>Let me know if you prefer I not forward you these communications. To learn how to manage your contact preferences for other parts of Microsoft, please read our <a href="${PRIVACY_URL}">Privacy Statement</a>.</p>` +
        '<p>Microsoft Corporation<br>One Microsoft Way<br>Redmond, WA 98052</p>',
      links: [],
      showMark: true,
      logo: ME7_FOOTER_LOGO,
      legal: `©${new Date().getFullYear()} Microsoft Corporation. All rights reserved.`,
    },
  }

  const base = emptyCampaign('newsletter')
  return {
    campaign: {
      ...base,
      name: 'ME7 + Copilot and AI Consumption learning paths',
      subject: 'Find the right ME7 + Copilot and AI Consumption learning path for you!',
      kicker: '',
      title: '',
      subtitle: '',
      banner_image: ME7_HERO,
      newsletter: writeDesign(design),
    },
    agenda: [],
    spotlights: [],
    rows: [],
  }
}
