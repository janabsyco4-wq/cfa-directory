import Image from "next/image";
import { frameStyle, type PhotoFrame } from "@/lib/photoFrame";

interface Props {
  photo?: string;
  frame?: PhotoFrame;
  firstName: string;
  lastName: string;
  size: number;
}

export default function MemberAvatar({ photo, frame, firstName, lastName, size }: Props) {
  return (
    <div
      className="relative rounded-xl overflow-hidden flex-shrink-0 bg-green-700 flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {photo ? (
        <Image src={photo} alt="" fill sizes={`${size}px`} style={frameStyle(frame)} />
      ) : (
        <span className="text-white text-xs font-bold">
          {firstName?.[0]}{lastName?.[0]}
        </span>
      )}
    </div>
  );
}
