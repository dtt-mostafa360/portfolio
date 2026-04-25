import { HistoryList } from "@/components/history-list";

export default function HistoryPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold text-white">Recent History</h1>
      <p className="text-sm text-zinc-300">Your latest 20 repository visits saved in this browser.</p>
      <HistoryList />
    </div>
  );
}
