import bcrypt from 'bcrypt';

async function generatePasswordHashes() {
  const password = 'CivilifyP1!';
  const saltRounds = 10;
  
  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    console.log('Generated password hash for "CivilifyP1!":');
    console.log(hashedPassword);
    console.log('\nSQL to update all users:');
    console.log(`
UPDATE users SET password_hash = '${hashedPassword}' WHERE username IN ('arda', 'deloscientos', 'paden', 'sendrijas', 'tagarao');
    `);
    
    console.log('\nOr individual updates:');
    const users = ['arda', 'deloscientos', 'paden', 'sendrijas', 'tagarao'];
    users.forEach(username => {
      console.log(`UPDATE users SET password_hash = '${hashedPassword}' WHERE username = '${username}';`);
    });
    
  } catch (error) {
    console.error('Error generating password hash:', error);
  }
}

generatePasswordHashes();
