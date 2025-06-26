import { JSX, SVGProps } from "react";

export default function Logout(
  props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>
) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      height="24"
      width="24"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M13 3c-.55 0-1 .45-1 1v6h2V5h4v14h-4v-5h-2v6c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1h-6zM9 8l-4 4 4 4v-3h8v-2H9V8z" />
    </svg>
  );
}
