module.exports = {
  apps: [
    {
      name: 'gate-index',
      script: './gate-index.js',
      watch: false,
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'gate-autobuy',
      script: './gate-autobuy.js',
      watch: false,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
