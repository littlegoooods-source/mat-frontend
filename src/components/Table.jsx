function Table({ columns, data, onRowClick, emptyMessage = 'Нет данных' }) {
  if (!data || data.length === 0) {
    return (
      <div className="glass rounded-xl p-12 text-center">
        <p className="text-slate-400">{emptyMessage}</p>
      </div>
    );
  }

  const dataColumns = columns.filter((col) => col.title);
  const mobileDataColumns = dataColumns.filter((col) => !col.mobileHidden);
  const actionColumn = columns.find((col) => !col.title);

  return (
    <>
      {/* Desktop table */}
      <div className="glass rounded-xl overflow-hidden hidden md:block">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.key} style={{ width: col.width }}>
                    {col.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr 
                  key={row.id || index}
                  onClick={() => onRowClick?.(row)}
                  className={onRowClick ? 'cursor-pointer' : ''}
                >
                  {columns.map((col) => (
                    <td key={col.key}>
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile card list */}
      <div className="space-y-3 md:hidden">
        {data.map((row, index) => (
          <div
            key={row.id || index}
            onClick={() => onRowClick?.(row)}
            className={`glass rounded-xl p-4 space-y-2 ${onRowClick ? 'cursor-pointer active:bg-slate-700/30' : ''}`}
          >
            {mobileDataColumns.map((col) => (
              <div key={col.key} className="flex justify-between items-start gap-3">
                <span className="text-xs text-slate-400 uppercase tracking-wide shrink-0 pt-0.5">
                  {col.title}
                </span>
                <span className="text-sm text-slate-200 text-right">
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </span>
              </div>
            ))}
            {actionColumn && (
              <div className="flex justify-end pt-2 border-t border-slate-700/50">
                {actionColumn.render ? actionColumn.render(row[actionColumn.key], row) : row[actionColumn.key]}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

export default Table;
