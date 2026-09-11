module.exports = {
  admin: {
    username: process.env.ADMIN_USER || 'owner',
    password: process.env.ADMIN_PASSWORD || 'FalconTrack92'
  },
  technician: {
    username: process.env.TECH_USER || 'technician',
    password: process.env.TECH_PASSWORD || 'FalconRoute47'
  }
};
