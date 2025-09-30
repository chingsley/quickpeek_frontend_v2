import TLocation from "./location.types";

type TUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  deviceType: string;
  deviceToken: string;
  locationSharingEnabled: boolean;
  notificationsEnabled: boolean;
  location?: TLocation;
};

export default TUser;