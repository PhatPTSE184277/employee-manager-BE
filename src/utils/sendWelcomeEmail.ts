import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

export const sendWelcomeEmail = async (
    employeeEmail: string,
    employeeName: string,
    verificationToken: string
) => {
    const setupLink = `${process.env.FRONTEND_URL}/employee/setup?token=${verificationToken}`;
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: employeeEmail,
        subject: 'Welcome to Employee Management System',
        html: `
    <div style="background: linear-gradient(135deg, #7f5af0 0%, #ec4899 100%); min-height:100vh; padding: 32px 0;">
      <div style="max-width: 420px; margin: 0 auto; background: rgba(24,24,27,0.95); border-radius: 16px; box-shadow: 0 4px 24px #0002; padding: 32px; color: #fff; font-family: 'Segoe UI', Arial, sans-serif; border: 1px solid #fff2;">
        <div style="text-align: center;">
          <h2 style="font-size: 2rem; font-weight: bold; margin-bottom: 8px; background: linear-gradient(90deg, #7f5af0, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Welcome, ${employeeName}!</h2>
          <p style="color: #a1a1aa; font-size: 1.1rem;">Your account has been created successfully.</p>
        </div>
        <div style="margin: 32px 0 24px 0; background: #232336; border-radius: 8px; padding: 20px;">
          <p style="color: #fff; text-align: center;">
            To set up your account, please click the button below:
          </p>
        </div>
        <div style="text-align: center; margin-bottom: 16px;">
          <a href="${setupLink}"
            style="display: inline-block; padding: 12px 32px; background: linear-gradient(90deg, #7f5af0, #ec4899); color: #fff; border-radius: 6px; font-weight: bold; text-decoration: none; font-size: 1.1rem; box-shadow: 0 2px 8px #0003;">
            Set Up Your Account
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #333; margin: 24px 0;">
        <p style="font-size: 0.95rem; color: #71717a; text-align: center;">If you did not expect this email, please ignore it.</p>
      </div>
    </div>
  `
    };

    await transporter.sendMail(mailOptions);
};
