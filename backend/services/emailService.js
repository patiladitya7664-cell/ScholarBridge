"use strict";

// ==================================================
// ScholarBridgee AI - EMAIL SERVICE
// Gmail SMTP + Nodemailer
// Registration OTP + Password Reset OTP
// ==================================================

const nodemailer = require("nodemailer");

let transporter = null;

// ==================================================
// 1. GET EMAIL TRANSPORTER
// ==================================================

function getTransporter() {
    if (transporter) {
        return transporter;
    }

    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailUser || !emailPass) {
        throw new Error(
            "Email configuration is missing. Check EMAIL_USER and EMAIL_PASS in your .env file."
        );
    }

    transporter = nodemailer.createTransport({
        service: "gmail",

        auth: {
            user: emailUser,
            pass: emailPass
        },

        connectionTimeout: 15000,
        greetingTimeout: 10000,
        socketTimeout: 20000
    });

    return transporter;
}

// ==================================================
// 2. COMMON EMAIL SENDER
// ==================================================

async function sendOTPEmail({
    email,
    otp,
    subject,
    heading,
    description,
    warning
}) {
    if (
        typeof email !== "string" ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
        throw new Error("A valid recipient email address is required.");
    }

    if (
        typeof otp !== "string" ||
        !/^\d{6}$/.test(otp)
    ) {
        throw new Error("A valid six-digit OTP is required.");
    }

    const emailUser = process.env.EMAIL_USER;
    const mailer = getTransporter();

    const text = [
        "ScholarBridgee AI",
        "",
        description,
        "",
        `Your OTP is: ${otp}`,
        "",
        "This OTP is valid for 10 minutes.",
        "Do not share this OTP with anyone.",
        "",
        warning
    ].join("\n");

    const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${heading}</title>
        </head>

        <body style="
            margin:0;
            padding:24px 12px;
            background:#f3f7f3;
            font-family:Arial,Helvetica,sans-serif;
            color:#1f2937;
        ">

            <div style="
                max-width:520px;
                margin:0 auto;
                background:#ffffff;
                border-radius:14px;
                overflow:hidden;
                border:1px solid #e5e7eb;
            ">

                <div style="
                    padding:24px;
                    background:#166534;
                    color:#ffffff;
                    text-align:center;
                ">
                    <h1 style="
                        margin:0;
                        font-size:25px;
                    ">ScholarBridgee AI</h1>

                    <p style="
                        margin:8px 0 0;
                        font-size:13px;
                        color:#dcfce7;
                    ">Your scholarship journey starts here</p>
                </div>

                <div style="padding:28px 24px;">

                    <h2 style="
                        margin:0 0 16px;
                        font-size:21px;
                        color:#166534;
                    ">${heading}</h2>

                    <p style="
                        font-size:15px;
                        line-height:1.7;
                    ">${description}</p>

                    <div style="
                        margin:24px 0;
                        padding:22px 12px;
                        background:#f0fdf4;
                        border:1px solid #dcfce7;
                        border-radius:12px;
                        text-align:center;
                    ">

                        <p style="
                            margin:0 0 12px;
                            font-size:12px;
                            color:#4b5563;
                        ">YOUR ONE-TIME PASSWORD</p>

                        <div style="
                            font-size:32px;
                            font-weight:bold;
                            letter-spacing:8px;
                            color:#166534;
                        ">${otp}</div>

                    </div>

                    <p style="
                        font-size:14px;
                        line-height:1.7;
                    ">
                        This OTP expires in
                        <strong>10 minutes</strong>.
                    </p>

                    <p style="
                        font-size:14px;
                        line-height:1.7;
                        color:#b91c1c;
                    ">
                        <strong>Security reminder:</strong>
                        Never share this OTP with anyone.
                    </p>

                    <p style="
                        margin-top:24px;
                        padding-top:18px;
                        border-top:1px solid #e5e7eb;
                        font-size:12px;
                        line-height:1.7;
                        color:#6b7280;
                    ">${warning}</p>

                </div>

                <div style="
                    padding:16px;
                    background:#f9fafb;
                    text-align:center;
                    font-size:12px;
                    color:#6b7280;
                ">
                    © ${new Date().getFullYear()} ScholarBridgee AI
                </div>

            </div>

        </body>
        </html>
    `;

    try {
        const result = await mailer.sendMail({
            from: `"ScholarBridgee AI" <${emailUser}>`,
            to: email,
            subject,
            text,
            html
        });

        console.log(
            `Email sent successfully. Message ID: ${result.messageId}`
        );

        return result;

    } catch (error) {
        // Keep credentials and OTPs out of server logs.
        console.error("Email delivery failed:", {
            code: error.code || "UNKNOWN",
            responseCode: error.responseCode || null
        });

        throw new Error(
            "Unable to send the email. Please check your email configuration and try again."
        );
    }
}

// ==================================================
// 3. REGISTRATION OTP EMAIL
// ==================================================

async function sendRegistrationOTP(email, otp) {
    return sendOTPEmail({
        email,
        otp,

        subject: "Verify your ScholarBridgee AI account",

        heading: "Verify Your Email",

        description:
            "Use the one-time password below to verify your ScholarBridgee AI student account.",

        warning:
            "If you did not request this verification, you can safely ignore this email."
    });
}

// ==================================================
// 4. PASSWORD RESET OTP EMAIL
// ==================================================

async function sendPasswordResetOTP(email, otp) {
    return sendOTPEmail({
        email,
        otp,

        subject: "ScholarBridgee AI password reset OTP",

        heading: "Reset Your Password",

        description:
            "Use the one-time password below to continue resetting your ScholarBridgee AI account password.",

        warning:
            "If you did not request a password reset, ignore this email and do not share the OTP."
    });
}

// ==================================================
// 5. EXPORT FUNCTIONS
// ==================================================

module.exports = {
    sendRegistrationOTP,
    sendPasswordResetOTP
};