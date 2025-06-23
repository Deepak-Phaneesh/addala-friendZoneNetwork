import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

interface GroupCardProps {
  group: any;
  showNewPosts?: boolean;
}

export default function GroupCard({ group, showNewPosts = false }: GroupCardProps) {
  const getGroupIcon = (groupName: string) => {
    const name = groupName.toLowerCase();
    if (name.includes('photo')) return '📷';
    if (name.includes('hiking') || name.includes('outdoor')) return '🥾';
    if (name.includes('coffee') || name.includes('cafe')) return '☕';
    if (name.includes('book') || name.includes('reading')) return '📚';
    if (name.includes('music')) return '🎵';
    if (name.includes('cooking') || name.includes('food')) return '🍳';
    if (name.includes('travel')) return '✈️';
    if (name.includes('tech') || name.includes('programming')) return '💻';
    return '👥';
  };

  const getGradientColor = (index: number = 0) => {
    const gradients = [
      'from-brand-blue to-brand-green',
      'from-brand-green to-brand-orange',
      'from-brand-orange to-yellow-400',
      'from-purple-500 to-pink-500',
      'from-blue-500 to-purple-500',
      'from-green-500 to-teal-500',
    ];
    return gradients[index % gradients.length];
  };

  return (
    <div className="flex items-center space-x-3">
      <div className={`w-10 h-10 bg-gradient-to-r ${getGradientColor(group.id)} rounded-lg flex items-center justify-center`}>
        <span className="text-white text-lg">
          {getGroupIcon(group.name)}
        </span>
      </div>
      <div className="flex-1">
        <h5 className="font-medium text-gray-900 text-sm">{group.name}</h5>
        <p className="text-xs text-gray-500">{group.memberCount} members</p>
      </div>
      {showNewPosts && (
        <Badge className="bg-brand-blue text-white text-xs rounded-full px-2 py-1">
          2
        </Badge>
      )}
    </div>
  );
}
