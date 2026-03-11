function Card({ children, className = '', hover = false }) {
  return (
    <div className={`
      glass rounded-xl p-6
      ${hover ? 'card-hover' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, color = 'primary' }) {
  const colorClasses = {
    primary: 'from-primary-500/20 to-primary-600/10 text-primary-400',
    green: 'from-green-500/20 to-green-600/10 text-green-400',
    blue: 'from-blue-500/20 to-blue-600/10 text-blue-400',
    purple: 'from-purple-500/20 to-purple-600/10 text-purple-400',
    red: 'from-red-500/20 to-red-600/10 text-red-400',
    yellow: 'from-yellow-500/20 to-yellow-600/10 text-yellow-400',
  };

  return (
    <Card hover className="relative overflow-hidden">
      <div className={`
        absolute top-0 right-0 w-32 h-32 
        bg-gradient-to-br ${colorClasses[color]} 
        rounded-full blur-3xl opacity-50 -mr-10 -mt-10
      `} />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <span className="text-slate-400 text-sm font-medium">{title}</span>
          {Icon && (
            <div className={`p-2 rounded-lg bg-gradient-to-br ${colorClasses[color]}`}>
              <Icon size={20} />
            </div>
          )}
        </div>
        
        <div className="text-2xl sm:text-3xl font-display font-bold text-white mb-1 break-words">
          {value}
        </div>
        
        {subtitle && (
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm">{subtitle}</span>
            {trend && (
              <span className={`text-sm font-medium ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {trend > 0 ? '+' : ''}{trend}%
              </span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

export default Card;
