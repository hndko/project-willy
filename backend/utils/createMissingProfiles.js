// Script to create profiles for users that don't have one
const { User, Profile, sequelize } = require("../models");

async function createMissingProfiles() {
  try {
    console.log("Starting to create missing profiles...");

    // Get all users
    const users = await User.findAll();
    console.log(`Found ${users.length} users`);

    let created = 0;

    // For each user, check if they have a profile
    for (const user of users) {
      const existingProfile = await Profile.findOne({
        where: { user_id: user.id },
      });

      // If no profile exists, create one
      if (!existingProfile) {
        await Profile.create({
          user_id: user.id,
          full_name: user.name || "",
          email: user.email,
          phone_number: user.phone || "",
          is_complete: false,
        });
        created++;
        console.log(`Created profile for user ${user.username} (${user.id})`);
      }
    }

    console.log(`Created ${created} new profiles for users that didn't have one`);
    console.log("Process completed successfully");
  } catch (error) {
    console.error("Error creating profiles:", error);
  } finally {
    // Close the database connection
    await sequelize.close();
  }
}

// Run the function
createMissingProfiles();
