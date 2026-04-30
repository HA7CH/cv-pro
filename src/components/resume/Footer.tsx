export default function Footer({ name }: { name: string }) {
  return (
    <footer className="py-4 text-center text-zinc-500">
      <p>
        &copy; {new Date().getFullYear()} {name}. All rights reserved.
      </p>
    </footer>
  );
}
