import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BookCover } from "../src/components/BookCover";
import { Pagination } from "../src/components/Pagination";
import { StarInput, Stars } from "../src/components/Stars";

describe("BookCover", () => {
  it("shows the generated cover when the image fails to load", () => {
    render(<BookCover src="https://example.com/missing.jpg" title="Dune" author="Frank Herbert" />);
    fireEvent.error(screen.getByRole("img", { name: "Cover of Dune" }));
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("Dune")).toBeInTheDocument();
    expect(screen.getByText("Frank Herbert")).toBeInTheDocument();
  });

  it("renders the fallback when there is no image at all", () => {
    render(<BookCover src={null} title="Emma" author="Jane Austen" />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("Emma")).toBeInTheDocument();
  });
});

describe("Stars", () => {
  it("describes the rating for screen readers", () => {
    render(<Stars value={4.3} count={12} />);
    expect(screen.getByLabelText("Rated 4.3 out of 5 from 12 reviews")).toBeInTheDocument();
  });

  it("says when there are no reviews", () => {
    render(<Stars value={null} />);
    expect(screen.getByText("No reviews yet")).toBeInTheDocument();
  });

  it("lets the user pick a rating", async () => {
    const onChange = vi.fn();
    render(<StarInput value={0} onChange={onChange} />);
    await userEvent.click(screen.getByRole("radio", { name: "4 stars" }));
    expect(onChange).toHaveBeenCalledWith(4);
  });
});

describe("Pagination", () => {
  it("disables previous on the first page and moves forward", async () => {
    const onChange = vi.fn();
    render(<Pagination page={1} totalPages={3} onChange={onChange} />);
    expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("renders nothing for a single page", () => {
    const { container } = render(<Pagination page={1} totalPages={1} onChange={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });
});
