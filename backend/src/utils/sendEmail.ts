import nodemailer, { Transporter, TransportOptions } from 'nodemailer';
import ejs from 'ejs';
import path from 'path';
import { SMTP_HOST, SMTP_PORT, SMTP_PASSWORD, SMTP_USER, SMTP_SERVICE } from "../config"

interface EmailOptions {
    email: string;
    subject: string;
    template: string;
    data: { [key: string]: any }
}

const sendEmail = async (options: EmailOptions): Promise<void> => {
    const transporter: Transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        service: SMTP_SERVICE,
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASSWORD
        }
    } as TransportOptions);

    const { email, subject, template, data } = options;
    // Path to your email template
    const templatePath = path.join(__dirname, '../emails', template);

    // Rendering email template with ejs
    const html: string = await ejs.renderFile(templatePath, data)

    const mailOptions = {
        from: SMTP_USER,
        to: email,
        subject: subject,
        html
    };
    await transporter.sendMail(mailOptions)

}
export default sendEmail

