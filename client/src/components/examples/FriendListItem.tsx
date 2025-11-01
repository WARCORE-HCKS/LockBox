import FriendListItem from "../FriendListItem";
import avatar1 from "@assets/generated_images/Female_user_avatar_portrait_abd7f3c7.png";
import avatar2 from "@assets/generated_images/Male_user_avatar_portrait_9b21d128.png";

export default function FriendListItemExample() {
  return (
    <div className="w-80 bg-sidebar p-4 space-y-2">
      <FriendListItem
        id="1"
        name="Sarah Johnson"
        avatar={avatar1}
        status="online"
        lastMessage="Hey! Are we still on for tonight?"
        unreadCount={3}
        isActive={true}
        onClick={() => console.log("Clicked Sarah")}
      />
      <FriendListItem
        id="2"
        name="Mike Chen"
        avatar={avatar2}
        status="away"
        lastMessage="I'll send you the files tomorrow"
        onClick={() => console.log("Clicked Mike")}
      />
      <FriendListItem
        id="3"
        name="Emma Wilson"
        status="offline"
        lastMessage="Thanks for your help!"
        onClick={() => console.log("Clicked Emma")}
      />
    </div>
  );
}
