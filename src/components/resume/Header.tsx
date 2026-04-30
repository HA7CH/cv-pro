import { cn } from "@/lib/utils";

export default function Header({ name }: { name: string }) {
  return (
    <header className="my-8 flex items-center justify-center">
      <div
        data-cursor="block"
        data-voice="You can call me Lawted as well"
        className={cn(
          "font-serif w-fit rounded px-2 py-1 text-4xl text-zinc-900",
        )}
      >
        {name}
      </div>
    </header>
  );
}
