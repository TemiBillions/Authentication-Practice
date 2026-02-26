const nodemailer = require('nodemailer');
const ejs = require('ejs');
const path = require('path');


const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST, // e.g., 'smtp.gmail.com'
    port: process.env.EMAIL_PORT, // e.g., 587 for TLS
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS, 
    },
});

// Function to render EJS template
const renderTemplate = async (templateName, data) => {
    try {
        const templatePath = path.join(__dirname, '../templates', `${templateName}.ejs`);
        const html = await ejs.renderFile(templatePath, data);
        return html;
    } catch (error) {
        console.error('Error rendering template:', error);
        throw error;
    }
};

// Main email sending function
const sendEmail = async (to, subject, templateName, templateData = {}) => {
    try {
        // Render the EJS template
        const html = await renderTemplate(templateName, templateData);

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            html, // Send as HTML
        };

        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${to}`);
        return { success: true, message: 'Email sent successfully' };
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

module.exports = { sendEmail, renderTemplate };

