import ChatHeader from "../ChatHeader";
import avatar1 from "@assets/generated_images/Female_user_avatar_portrait_abd7f3c7.png";

export default function ChatHeaderExample() {
  return (
    <div className="bg-background">
      <ChatHeader
        friend={{
          name: "Sarah Johnson",
          avatar: avatar1,
          status: "online",
        }}
        onVoiceCall={() => console.log("Voice call")}
        onVideoCall={() => console.log("Video call")}
        onSettings={() => console.log("Settings")}
      />
    </div>
  );
}
