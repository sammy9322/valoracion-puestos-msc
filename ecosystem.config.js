module.exports = {
  apps: [
    {
      name: 'msc-server',
      script: 'npm.cmd',
      args: 'run dev',
      cwd: './server',
      interpreter: 'none',
      env: {
        NODE_ENV: 'development'
      }
    },
    {
      name: 'msc-frontend',
      script: 'npm.cmd',
      args: 'run dev',
      cwd: './frontend',
      interpreter: 'none',
      env: {
        NODE_ENV: 'development'
      }
    }
  ]
};
