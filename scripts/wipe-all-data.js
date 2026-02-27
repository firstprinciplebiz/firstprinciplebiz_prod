#!/usr/bin/env node

/**
 * WIPE ALL DATA SCRIPT
 * 
 * WARNING: This script will DELETE ALL DATA from your Supabase database including:
 * - All user data (profiles, issues, messages, notifications, etc.)
 * - All authentication users (auth.users)
 * - All OAuth providers
 * - All storage files (avatars, attachments, chat attachments)
 * 
 * This is IRREVERSIBLE. Make sure you have backups if needed.
 * 
 * Usage:
 *   node scripts/wipe-all-data.js
 * 
 * Required environment variables:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

// Try to load environment variables from .env.local if dotenv is available
try {
  require('dotenv').config({ path: '.env.local' });
} catch (e) {
  // dotenv not available, assume env vars are set in environment
}

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nMake sure these are set in your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function wipeAllData() {
  console.log('⚠️  WARNING: This will DELETE ALL DATA from your database!');
  console.log('   This includes:');
  console.log('   - All users, profiles, issues, messages, notifications');
  console.log('   - All authentication users and OAuth providers');
  console.log('   - All storage files (avatars, attachments, chat attachments)');
  console.log('\n⏳ Starting data wipe...\n');

  try {
    // Step 1: Delete all data from child tables
    console.log('📊 Step 1: Deleting data from tables...');
    
    const tables = [
      'issue_interests',
      'messages',
      'notifications',
      'issues',
      'student_profiles',
      'business_profiles',
      'users',
    ];

    // Delete all data from tables
    // Note: For large datasets, the SQL script is more efficient
    // This approach deletes in batches until all rows are gone
    for (const table of tables) {
      let deletedCount = 0;
      let hasMore = true;
      const batchSize = 1000;
      
      while (hasMore) {
        // Get a batch of rows
        const { data: rows, error: selectError } = await supabase
          .from(table)
          .select('id')
          .limit(batchSize);
        
        if (selectError) {
          console.error(`   ❌ Error selecting from ${table}:`, selectError.message);
          break;
        }
        
        if (!rows || rows.length === 0) {
          hasMore = false;
          break;
        }
        
        // Delete this batch
        const ids = rows.map(row => row.id);
        const { error: deleteError } = await supabase
          .from(table)
          .delete()
          .in('id', ids);
        
        if (deleteError) {
          console.error(`   ❌ Error deleting from ${table}:`, deleteError.message);
          console.log(`   💡 Tip: Use the SQL script (00099_wipe_all_data.sql) for more reliable deletion`);
          break;
        }
        
        deletedCount += ids.length;
        hasMore = rows.length === batchSize; // Continue if we got a full batch
      }
      
      if (deletedCount > 0) {
        console.log(`   ✅ Deleted ${deletedCount} rows from ${table}`);
      } else {
        console.log(`   ✅ ${table} is already empty`);
      }
    }

    // Step 2: Delete all authentication users
    console.log('\n👤 Step 2: Deleting authentication users...');
    
    // Get all auth users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('   ❌ Error fetching users:', usersError.message);
    } else {
      console.log(`   📋 Found ${users?.users?.length || 0} users to delete`);
      
      for (const user of users?.users || []) {
        const { error } = await supabase.auth.admin.deleteUser(user.id);
        if (error) {
          console.error(`   ❌ Error deleting user ${user.email}:`, error.message);
        } else {
          console.log(`   ✅ Deleted user: ${user.email || user.id}`);
        }
      }
    }

    // Step 3: Delete all storage files
    console.log('\n📁 Step 3: Deleting storage files...');
    
    const buckets = ['chat-attachments', 'attachments', 'avatars'];
    
    for (const bucketId of buckets) {
      // List all files in the bucket
      const { data: files, error: listError } = await supabase.storage
        .from(bucketId)
        .list('', {
          limit: 1000,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' },
        });

      if (listError) {
        console.error(`   ❌ Error listing files in ${bucketId}:`, listError.message);
        continue;
      }

      if (!files || files.length === 0) {
        console.log(`   ✅ No files in ${bucketId}`);
        continue;
      }

      console.log(`   📋 Found ${files.length} files in ${bucketId}`);

      // Delete files in batches
      const filePaths = files.map((file) => file.name);
      
      // For nested files, we need to get the full path
      // Let's delete recursively by listing all files
      const deleteRecursive = async (path = '') => {
        const { data: items, error } = await supabase.storage
          .from(bucketId)
          .list(path, {
            limit: 1000,
            sortBy: { column: 'name', order: 'asc' },
          });

        if (error) {
          console.error(`   ❌ Error listing ${path}:`, error.message);
          return;
        }

        if (!items || items.length === 0) return;

        const filesToDelete = items
          .filter((item) => !item.id) // Files don't have id, folders do
          .map((item) => path ? `${path}/${item.name}` : item.name);

        if (filesToDelete.length > 0) {
          const { error: deleteError } = await supabase.storage
            .from(bucketId)
            .remove(filesToDelete);

          if (deleteError) {
            console.error(`   ❌ Error deleting files from ${path}:`, deleteError.message);
          } else {
            console.log(`   ✅ Deleted ${filesToDelete.length} files from ${path || 'root'}`);
          }
        }

        // Recursively delete from subfolders
        const folders = items.filter((item) => item.id);
        for (const folder of folders) {
          await deleteRecursive(path ? `${path}/${folder.name}` : folder.name);
        }
      };

      await deleteRecursive();
    }

    // Step 4: Verification
    console.log('\n🔍 Step 4: Verifying deletion...');
    
    const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
    const { count: studentsCount } = await supabase.from('student_profiles').select('*', { count: 'exact', head: true });
    const { count: businessCount } = await supabase.from('business_profiles').select('*', { count: 'exact', head: true });
    const { count: issuesCount } = await supabase.from('issues').select('*', { count: 'exact', head: true });
    const { count: messagesCount } = await supabase.from('messages').select('*', { count: 'exact', head: true });
    const { count: notificationsCount } = await supabase.from('notifications').select('*', { count: 'exact', head: true });
    
    const { data: remainingUsers } = await supabase.auth.admin.listUsers();

    console.log('\n📊 Verification Results:');
    console.log(`   Users (public.users): ${usersCount || 0}`);
    console.log(`   Student Profiles: ${studentsCount || 0}`);
    console.log(`   Business Profiles: ${businessCount || 0}`);
    console.log(`   Issues: ${issuesCount || 0}`);
    console.log(`   Messages: ${messagesCount || 0}`);
    console.log(`   Notifications: ${notificationsCount || 0}`);
    console.log(`   Auth Users: ${remainingUsers?.users?.length || 0}`);

    console.log('\n✅ Data wipe completed successfully!');
    console.log('   You can now start feeding real data.');
  } catch (error) {
    console.error('\n❌ Error during data wipe:', error);
    process.exit(1);
  }
}

// Run the script
wipeAllData();

