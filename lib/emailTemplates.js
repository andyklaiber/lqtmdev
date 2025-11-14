'use strict';
const handlebars = require('handlebars');

/**
 * Email Template Service
 * Handles email template rendering and sending with dependency injection for testability
 */

const DEFAULT_EMAIL_TEMPLATE = {
  subject: '{{eventName}} Registration',
  body: `<html><head></head><body>
<h1>Thank you for registering for {{eventName}}</h1>
<p>
Name: {{name}}<br>
Team/Sponsor: {{sponsor}}<br>
Race Category: {{category}}<br>
<p><a href="{{rosterLink}}">Go Here</a> to see who else is signed up<p>
<p>For information about the event, check out <a href="{{eventHomePageUrl}}">{{eventHomePageUrl}}</a></p>
<p>For issues with your registration information, <a href="mailto:{{eventContactEmail}}">email us!</a></p>
</body></html>`
};

/**
 * Get the default email template
 * @returns {Object} Default template with subject and body
 */
function getDefaultTemplate() {
  return { ...DEFAULT_EMAIL_TEMPLATE };
}

/**
 * Normalize email template to object format (handles backwards compatibility)
 * @param {string|Object} template - Template string or object
 * @returns {Object} Normalized template object with subject and body
 */
function normalizeTemplate(template) {
  // If it's already an object with subject and body, return it
  if (template && typeof template === 'object' && template.subject && template.body) {
    return template;
  }
  
  // If it's a string (old format), convert to new format with default subject
  if (typeof template === 'string') {
    return {
      subject: DEFAULT_EMAIL_TEMPLATE.subject,
      body: template
    };
  }
  
  // If no template provided, return default
  return getDefaultTemplate();
}

/**
 * Prepare template data from registration and race data
 * @param {Object} regData - Registration data
 * @param {Object} raceData - Race data
 * @param {Function} capitalizeName - Name capitalization function
 * @returns {Object} Template data for rendering
 */
function prepareTemplateData(regData, raceData, capitalizeName) {
  const _ = require('lodash');
  const regCat = _.find(raceData.regCategories, { "id": regData.category });
  
  return {
    name: capitalizeName(regData.first_name + " " + regData.last_name),
    sponsor: regData.sponsor,
    eventHomePageUrl: raceData.eventDetails?.homepageUrl || '',
    eventName: raceData.eventDetails?.name || raceData.displayName || 'the event',
    eventContactEmail: raceData.contactEmail || 'support@signup.bike',
    rosterLink: `${process.env.DOMAIN}/#/roster/${regData.raceid}`,
    category: regCat ? regCat.catdispname : "Category not found",
  };
}

/**
 * Render email template with data
 * @param {string|Object} template - Template string or object
 * @param {Object} data - Template data
 * @returns {Object} Rendered email with subject and html
 */
function renderTemplate(template, data) {
  const normalizedTemplate = normalizeTemplate(template);
  
  const subjectTemplate = handlebars.compile(normalizedTemplate.subject);
  const bodyTemplate = handlebars.compile(normalizedTemplate.body);
  
  return {
    subject: subjectTemplate(data),
    html: bodyTemplate(data)
  };
}

/**
 * Send registration confirmation email
 * @param {Object} options - Email options
 * @param {Object} options.regData - Registration data
 * @param {Object} options.raceData - Race data
 * @param {Object} options.logger - Logger instance
 * @param {Function} options.capitalizeName - Name capitalization function
 * @param {Function} options.emailSender - Email sending function (for dependency injection)
 * @returns {Promise} Email sending promise
 */
async function sendRegistrationEmail({ regData, raceData, logger, capitalizeName, emailSender }) {
  const _ = require('lodash');
  
  // Skip test emails
  if (_.indexOf(regData.email, 'test.com') > -1) {
    logger.info({ regData }, 'test email, not sending confirmation email');
    return;
  }
  
  // Prepare template data
  const templateData = prepareTemplateData(regData, raceData, capitalizeName);
  
  // Get and render template
  const template = raceData.emailTemplate || getDefaultTemplate();
  const rendered = renderTemplate(template, templateData);
  
  // Prepare email payload
  const emailPayload = {
    sender: {
      name: "Signup.bike",
      email: "support@signup.bike"
    },
    to: [{
      email: regData.email,
      name: templateData.name
    }],
    subject: rendered.subject,
    htmlContent: rendered.html,
    headers: {
      charset: "iso-8859-1"
    },
    tags: [`race:${raceData.raceid}`]
  };
  
  try {
    await emailSender(emailPayload);
    logger.info({ email: regData.email }, 'Registration confirmation email sent');
  } catch (err) {
    logger.error({ err, regData }, 'Error sending registration confirmation email');
    throw err;
  }
}

module.exports = {
  getDefaultTemplate,
  normalizeTemplate,
  prepareTemplateData,
  renderTemplate,
  sendRegistrationEmail
};

