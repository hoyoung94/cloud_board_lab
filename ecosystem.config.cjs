module.exports = {
  apps: [
    {
      name: "cloud-board-lab",
      cwd: "/var/www/cloud_board_lab",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      interpreter: "node",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
    },
  ],
};
