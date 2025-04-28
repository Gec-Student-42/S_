import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    console.log("Searching for:", searchQuery);
  }, [searchQuery]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  return (
    <div className="flex-1">
      <form onSubmit={handleSearch} className="relative">
        <Input
          type="text"
          placeholder="Search documents..."
          className="w-full px-3 py-1.5 pl-9 bg-white border border-gray-200 rounded-lg shadow-sm h-10"
          value={searchQuery}
          onChange={handleChange}
        />
        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
      </form>
    </div>
  );
};

export default SearchBar;
