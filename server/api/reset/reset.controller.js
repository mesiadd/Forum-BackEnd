const pool = require("../../config/database");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { sendPasswordResetEmail } = require("./reset.service"); // Import the email sending function

// Request password reset
exports.requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  try {
    // Check if the user with the provided email exists
    const userQuery = `
      SELECT user_email
      FROM registration
      WHERE user_email = ?;
    `;

    const userResult = await pool.query(userQuery, [email]);

    if (userResult.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    // Update user's reset token and expiration
    const updateUserQuery = `
      UPDATE registration
      SET resetToken = ?, resetTokenExpiration = ?
      WHERE user_email = ?;
    `;

    const updateResult = await pool.query(updateUserQuery, [
      resetToken,
      new Date(Date.now() + 3600000), // Token valid for 1 hour
      email,
    ]);

    // Send password reset email
    await sendPasswordResetEmail(email, resetToken);
    return res.status(200).json({ message: "Password reset email sent" });
  } catch (error) {
    console.error("Error requesting password reset:", error);
    return res.status(500).json({ message: "An error occurred" });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  const { resetToken, newPassword } = req.body;
  console.table(req.body);
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user's password and reset token
    const updateUserQuery = `
      UPDATE registration
      SET user_password = ?, resetToken = NULL, resetTokenExpiration = NULL
      WHERE resetToken = ? AND resetTokenExpiration > NOW();
    `;

    const updateResult = await pool.query(updateUserQuery, [
      hashedPassword,
      resetToken,
    ]);

    if (updateResult.affectedRows === 0) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    return res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Error resetting password:", error);
    return res.status(500).json({ message: "An error occurred" });
  }
};
