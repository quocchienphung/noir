import { notFound } from "next/navigation";

// The source links to /404 explicitly and serves it with HTTP 404; render the not-found view the same way.
export default function ExplicitNotFoundPage() {
  notFound();
}
