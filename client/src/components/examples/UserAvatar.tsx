import UserAvatar from "../UserAvatar";
import avatar1 from "@assets/generated_images/Female_user_avatar_portrait_abd7f3c7.png";

export default function UserAvatarExample() {
  return (
    <div className="p-8 space-y-4 bg-background">
      <div className="flex items-center gap-4">
        <UserAvatar name="Sarah Johnson" src={avatar1} size="sm" status="online" />
        <UserAvatar name="Sarah Johnson" src={avatar1} size="md" status="online" />
        <UserAvatar name="Sarah Johnson" src={avatar1} size="lg" status="online" />
      </div>
      <div className="flex items-center gap-4">
        <UserAvatar name="John Doe" size="md" status="away" />
        <UserAvatar name="Jane Smith" size="md" status="offline" />
        <UserAvatar name="Alex Brown" size="md" status="online" />
      </div>
    </div>
  );
}
