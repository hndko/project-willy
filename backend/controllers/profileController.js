const { Profile, User, sequelize } = require("../models");
const ApiError = require("../utils/apiError");
const catchAsync = require("../utils/catchAsync");
const { createActivityLog } = require("../services/activityLogService");
const fs = require("fs");
const path = require("path");

// Mendapatkan profile berdasarkan user yang login
exports.getProfile = catchAsync(async (req, res) => {
  const userId = req.user.id;

  // Find or create profile
  let profile = await Profile.findOne({
    where: { user_id: userId },
    include: [
      {
        model: User,
        as: "user",
        attributes: ["username", "email", "name", "phone", "is_active", "lastLogin"],
      },
    ],
  });

  // If profile doesn't exist, create one
  if (!profile) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Create profile
    const newProfile = await Profile.create({
      user_id: userId,
      full_name: user.name || "",
      email: user.email,
      phone_number: user.phone || "",
      is_complete: false,
    });

    // Fetch complete profile with user details
    profile = await Profile.findOne({
      where: { user_id: userId },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["username", "email", "name", "phone", "is_active", "lastLogin"],
        },
      ],
    });
  }

  res.status(200).json({
    status: "success",
    data: profile,
  });
});

// Update profile user
exports.updateProfile = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { full_name, email, phone_number } = req.body;

  // Find profile to update
  const profile = await Profile.findOne({ where: { user_id: userId } });

  if (!profile) {
    throw new ApiError(404, "Profile not found");
  }

  // Get the user with full model instance (for proper hook triggering)
  const user = await User.findByPk(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Validate email format
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ApiError(400, "Invalid email format");
    }

    // Check if email is already in use by another user
    if (email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser && existingUser.id !== userId) {
        throw new ApiError(400, "Email already in use by another account");
      }
    }
  }

  try {
    // Begin transaction to ensure both profile and user updates succeed or fail together
    const result = await sequelize.transaction(async (t) => {
      // Update profile
      await profile.update(
        {
          full_name: full_name || profile.full_name,
          email: email || profile.email,
          phone_number: phone_number || profile.phone_number,
          is_complete: true,
        },
        { transaction: t }
      );

      // Update user record using instance method to ensure hooks run
      if (email && email !== user.email) {
        console.log(`Updating email for user ${userId} from ${user.email} to ${email}`);
        user.email = email;
      }

      if (phone_number && phone_number !== user.phone) {
        console.log(`Updating phone for user ${userId} from ${user.phone} to ${phone_number}`);
        user.phone = phone_number;
      }

      if (full_name && full_name !== user.name) {
        console.log(`Updating name for user ${userId} from ${user.name} to ${full_name}`);
        user.name = full_name;
      }

      // Only save if any changes were made
      if (user.changed()) {
        await user.save({ transaction: t });
      }

      // Log activity
      await createActivityLog(
        {
          userId: userId,
          table: "Profile",
          action: "Update Profile",
          description: `User profile updated: ${user.username}`,
        },
        { transaction: t }
      );

      return profile;
    });

    res.status(200).json({
      status: "success",
      message: "Profile updated successfully",
      data: profile,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    throw new ApiError(500, "Failed to update profile: " + error.message);
  }
});

// Update profile picture
exports.updateProfilePicture = catchAsync(async (req, res) => {
  const userId = req.user.id;

  // Check if file exists
  if (!req.file) {
    throw new ApiError(400, "Profile picture is required");
  }

  // Get filename from req.file
  const profilePicture = req.file.filename;

  // First check if profile exists, create one if it doesn't
  let profile = await Profile.findOne({ where: { user_id: userId } });

  if (!profile) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Create profile
    profile = await Profile.create({
      user_id: userId,
      full_name: user.name || "",
      email: user.email,
      phone_number: user.phone || "",
      is_complete: false,
      profile_picture: profilePicture,
    });
  } else {
    // Hapus file lama jika ada dan berbeda dengan file baru
    if (profile.profile_picture && profile.profile_picture !== profilePicture) {
      const oldPath = path.join(__dirname, "../public/uploads", profile.profile_picture);
      try {
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      } catch (err) {
        console.error("Failed to delete old profile picture:", err);
      }
    }
    // Update existing profile with new picture
    await profile.update({ profile_picture: profilePicture });
  }

  // Log activity
  await createActivityLog({
    userId: userId,
    table: "Profile",
    action: "Update Profile Picture",
    description: `Profile picture updated`,
  });

  // Return the URL for the uploaded image
  const imageUrl = `/uploads/${profilePicture}`;

  res.status(200).json({
    status: "success",
    message: "Profile picture updated successfully",
    data: {
      profile_picture: profilePicture,
      image_url: imageUrl,
    },
  });
});

// Update password
exports.updatePassword = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { current_password, new_password, confirm_password } = req.body;

  // Check if new_password matches confirm_password
  if (new_password !== confirm_password) {
    throw new ApiError(400, "New password and confirm password do not match");
  }

  // Get the user with full model instance
  const user = await User.findByPk(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Verify current password
  const isPasswordCorrect = await user.correctPassword(current_password);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Current password is incorrect");
  }

  try {
    console.log(`Updating password for user ${userId}`);

    // Use the model instance method to update password
    // This ensures that the beforeUpdate hook is triggered
    user.password = new_password;
    await user.save();

    // Log activity
    await createActivityLog({
      userId: userId,
      table: "User",
      action: "Update Password",
      description: `Password updated for user ${user.username}`,
    });

    console.log(`Password updated successfully for user ${userId}`);

    res.status(200).json({
      status: "success",
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Error updating password:", error);
    throw new ApiError(500, "Failed to update password: " + error.message);
  }
});
