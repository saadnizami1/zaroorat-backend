const { transporter } = require("../config/nodemailer/nodemailer");

const Logo = `https://res.cloudinary.com/dupvtfaoc/image/upload/v1751021742/fundraising_app/shpy31bqfs1yim4v92fq.png`;

const sendResetPassword = async (name, toEmail, resetPasswordLink) => {
  try {
    const mailOptions = {
      from: `"Zaroorat" <${process.env.ADMIN_EMAIL}>`,
      to: toEmail,
      subject: "Reset Your Password - Zaroorat",
      html: `
<div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 30px;">
  <div style="max-width: 600px; margin: auto; background: #fff; padding: 20px; border-radius: 8px;">
  
<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">

<div style="text-align: center; margin-bottom: 20px;">
  <img src="${Logo}" alt="Zaroorat Logo" style="max-width: 150px;" />
</div>


          <h2 style="color: #0056b3;">Hello ${name},</h2>
          <p>You recently requested to reset your password for your zaroorat account.</p>
          <p>Please click the button below to reset your password:</p>
          <a href="${resetPasswordLink}" style="
              display: inline-block;
              padding: 10px 20px;
              margin: 10px 0;
              font-size: 16px;
              color: white;
              background-color: #007bff;
              text-decoration: none;
              border-radius: 5px;
          ">Reset Password</a>
          <p>If you didn’t request this, you can safely ignore this email.</p>
          <p style="margin-top: 20px;">Thanks,<br/>The Zaroorat Team</p>
        </div>
  </div>
</div>


        
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Password reset email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    return false;
  }
};

const sendFundApprovalMailToAdmin = async ({ fund, user }) => {
  try {
    const mailOptions = {
      from: `"Zaroorat" <${process.env.ADMIN_EMAIL}>`,
      to: process.env.ADMIN_EMAIL,
      subject: "New Fundraiser Created – Approval Required",
      html: `

<div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 30px;">
  <div style="max-width: 600px; margin: auto; background: #fff; padding: 20px; border-radius: 8px;">
    
    <div style="text-align: center; margin-bottom: 20px;">
      <img src="${Logo}" alt="Zaroorat Logo" style="max-width: 150px;" />
    </div>

    <h2 style="color: #0056b3;">New Fundraising Request</h2>
    <p>A new fundraiser has been created and is awaiting your approval.</p>

    <h3>Fund Details:</h3>
    <ul>
      <li><strong>Title:</strong> ${fund.fundraiseTitle}</li>
      <li><strong>Category:</strong> ${fund.fundCategory}</li>
      <li><strong>Target Amount:</strong> ${fund.totalAmountRaised}-Pkr</li>
    </ul>

    <h3>User Details:</h3>
    <ul>
      <li><strong>Name:</strong> ${user.name}</li>
      <li><strong>Email:</strong> ${user.email}</li>
    </ul>

    <h3>Bank Details:</h3>
    <ul>
      <li><strong>Account Holder Name:</strong> ${fund.accountHolderName || "N/A"}</li>
      <li><strong>Account Number:</strong> ${fund.accountNumber || "N/A"}</li>
      <li><strong>IFSC Code:</strong> ${fund.ifscCode || "N/A"}</li>
      <li><strong>Bank Code:</strong> ${fund.bankCode || "N/A"}</li>
      <li><strong>Bank Name:</strong> ${fund.bankName || "N/A"}</li>
    </ul>

    <p>Please log in to the admin panel to review and approve this fundraiser.</p>

    <p style="margin-top: 20px;">Thanks,<br/>The Zaroorat Team</p>
  </div>
</div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Admin notification email sent:", info.messageId);
  } catch (error) {
    console.error("Error sending admin approval email:", error);
  }
};

const sendFundCreationMailToUser = async ({ fund, user }) => {
  try {
    const mailOptions = {
      from: `"Zaroorat" <${process.env.ADMIN_EMAIL}>`,
      to: user.email,
      subject: "Your Fundraiser Has Been Created - Zaroorat",
      html: `
<div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 30px;">
  <div style="max-width: 600px; margin: auto; background: #fff; padding: 20px; border-radius: 8px;">
    <div style="text-align: center; margin-bottom: 20px;">
      <img src="${Logo}" alt="Zaroorat Logo" style="max-width: 150px;" />
    </div>

        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">

          <h2 style="color: #28a745;">Hello ${user.name},</h2>
          <p>Thank you for creating a new fundraiser on CampaignFund.</p>

          <h3>Fund Details:</h3>
          <ul>
            <li><strong>Title:</strong> ${fund.fundraiseTitle}</li>
            <li><strong>Category:</strong> ${fund.fundCategory}</li>
            <li><strong>Target Amount:</strong> ${fund.totalAmountRaised}-Pkr</li>
          </ul>

          <p>Your request is currently under review. You will be notified once it is approved by our team.</p>

          <p style="margin-top: 20px;">Thanks for making a difference!<br/>The Zaroorat Team</p>
        </div>
  </div>
</div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("User fundraising confirmation email sent:", info.messageId);
  } catch (error) {
    console.error("Error sending user fundraising confirmation email:", error);
  }
};

const sendFundStatusEmailToUser = async ({ fund, user, status }) => {
  try {
    const mailOptions = {
      from: `"Zaroorat" <${process.env.ADMIN_EMAIL}>`,
      to: user.email,
      subject: `Your Fundraiser Has Been ${status}`,
      html: `
<div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 30px;">
  <div style="max-width: 600px; margin: auto; background: #fff; padding: 20px; border-radius: 8px;">
<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
<div style="text-align: center; margin-bottom: 20px;">
  <img src="${Logo}" alt="Zaroorat Logo" style="max-width: 150px;" />
</div>
          <h2 style="color: ${status === "Approved" ? "#28a745" : "#dc3545"};">
            Fundraiser ${status}
          </h2>

          <p>Hi ${user.fullName},</p>

          <p>Your fundraiser has been <strong>${status}</strong> by the admin.</p>

          <h3>Fundraiser Details:</h3>
          <ul>
            <li><strong>Title:</strong> ${fund.fundraiseTitle}</li>
            <li><strong>Category:</strong> ${fund.fundCategory}</li>
            <li><strong>Target Amount:</strong> ${fund.totalAmountRaised}-Pkr</li>
          </ul>

          ${
            status === "Approved"
              ? `<p>You can now view your fundraiser live on the platform.</p>`
              : `<p>Unfortunately, your fundraiser was not approved. Please contact support if you have any questions.</p>`
          }
          <p style="margin-top: 20px;">Thanks,<br/>The Zaroorat Team</p>
        </div>
  </div>
</div>   
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("User fund status email sent:", info.messageId);
  } catch (error) {
    console.error("Error sending user fund status email:", error);
  }
};



const sendDonationNotificationToAdmin = async ({ donor, fund }) => {
  try {
    const mailOptions = {
      from: `"Zaroorat" <${process.env.ADMIN_EMAIL}>`,
      to: process.env.ADMIN_EMAIL,
      subject: "New Donation Received",
      html: `
<div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 30px;">
  <div style="max-width: 600px; margin: auto; background: #fff; padding: 20px; border-radius: 8px;">

    <div style="text-align: center; margin-bottom: 20px;">
      <img src="${Logo}" alt="Zaroorat Logo" style="max-width: 150px;" />
    </div>

    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #0056b3;">New Donation Received</h2>
      <p>A donation has been made to the following fundraiser:</p>

      <h3>Fund Details:</h3>
      <ul>
        <li><strong>Title:</strong> ${fund.fundraiseTitle}</li>
        <li><strong>Category:</strong> ${fund.fundCategory}</li>
      </ul>

      <h3>Donor Details:</h3>
      <ul>
        <li><strong>Name:</strong> ${donor.fullName}</li>
        <li><strong>Email:</strong> ${donor.email}</li>
        <li><strong>Contact:</strong> ${donor.contactNumber}</li>
        <li><strong>Amount:</strong> ${donor.amount} PKR</li>
        <li><strong>Donated At:</strong> ${new Date(donor.createdAt).toLocaleString()}</li>
      </ul>

      <p>Proof of donation has been attached for verification.</p>

      <p style="margin-top: 20px;">Thanks,<br/>The Zaroorat Team</p>
    </div>

  </div>
</div>
      `,
      attachments: [
        {
          filename: "donation-proof.jpg",
          path: donor.proofImage,
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    console.log("Admin donation email sent.");
  } catch (err) {
    console.error("Error sending donation email to admin:", err);
  }
};


const sendThankYouEmailToDonor = async ({ donor, fund }) => {
  try {
    const fundLink = `https://zaroorat.xyz/donate/${fund._id}`;

    const mailOptions = {
      from: `"Zaroorat" <${process.env.ADMIN_EMAIL}>`,
      to: donor.email,
      subject: "Thank You for Your Donation!",
      html: `
<div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 30px;">
  <div style="max-width: 600px; margin: auto; background: #fff; padding: 20px; border-radius: 8px;">

    <div style="text-align: center; margin-bottom: 20px;">
      <img src="${Logo}" alt="Zaroorat Logo" style="max-width: 150px;" />
    </div>

    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #0056b3;">Thank You, ${donor.fullName}!</h2>
      <p>We truly appreciate your generous donation of <strong>${donor.amount} PKR</strong>.</p>

      <h3>You Supported:</h3>
      <ul>
        <li><strong>Fundraiser:</strong> ${fund.fundraiseTitle}</li>
        <li><strong>Category:</strong> ${fund.fundCategory}</li>
        <li><strong>Donated At:</strong> ${new Date(donor.createdAt).toLocaleString()}</li>
      </ul>

      <div style="text-align: center; margin: 20px 0;">
        <a href="${fundLink}" style="
          background-color: #28a745;
          color: #fff;
          padding: 10px 20px;
          text-decoration: none;
          border-radius: 5px;
          font-weight: bold;
        ">View Fundraiser</a>
      </div>

      <p>Thank you for being part of our mission to make a difference.</p>

      <p style="margin-top: 20px;">Warm regards,<br/>The Zaroorat Team</p>
    </div>

  </div>
</div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("Thank you email sent to donor.");
  } catch (err) {
    console.error("Error sending thank you email to donor:", err);
  }
};


module.exports = {
  sendResetPassword,
  sendFundApprovalMailToAdmin,
  sendFundCreationMailToUser,
  sendFundStatusEmailToUser,
   sendThankYouEmailToDonor,
   sendDonationNotificationToAdmin
};
