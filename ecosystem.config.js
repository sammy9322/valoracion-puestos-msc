module.exports = {
  apps: [
    {
      name: 'msc-server',
      script: 'npm',
      args: 'run dev',
      cwd: './server',
      interpreter: 'none',
      env: {
        NODE_ENV: 'development'
      }
    },
    {
      name: 'msc-frontend',
      script: 'npm',
      args: 'run dev',
      cwd: './frontend',
      interpreter: 'none',
      env: {
        NODE_ENV: 'development'
      }
    }
  ]
};
