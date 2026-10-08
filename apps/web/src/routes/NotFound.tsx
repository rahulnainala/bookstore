import { Link } from "react-router";
import { EmptyState } from "../components/ui";
import { useTitle } from "../lib/useTitle";

export default function NotFound() {
  useTitle("Page not found");
  return (
    <EmptyState
      title="This page is out of print"
      action={
        <Link to="/" className="btn-primary">
          Back to the store
        </Link>
      }
    >
      We couldn't find the page you were looking for.
    </EmptyState>
  );
}
