import { execAsync } from "../jesmyl/deploy-the-code.mjs";
import { projectConfig } from "../jesmyl/paths.mjs";

const userIp = `root@${projectConfig.ip}:/var/www/${projectConfig.dns}`;

execAsync(
  `scp ./dist/latest*.yml ${userIp}/down/ && scp ./dist/*.exe ./dist/*.blockmap ./dist/*.AppImage ${userIp}/down/`,
);
