import { BarChart3, List, PieChart, Table2 } from 'lucide-react'
import { useMemo, useState } from 'react'

import { licenseTypes } from '../api/options.js'
import { EmptyState } from '../components/EmptyState.jsx'
import { MetricCard } from '../components/MetricCard.jsx'
import { StatusBadge } from '../components/StatusBadge.jsx'

export function StatsPage({ stats }) {
  const [crossView, setCrossView] = useState('chart')
  const [filterType, setFilterType] = useState(null)
  const [filterDept, setFilterDept] = useState(null)

  const byType = stats?.by_type || {}
  const byDepartment = stats?.by_department || {}
  const departments = stats?.departments || []
  const crossMatrix = stats?.cross_matrix || []
  const crossTotals = stats?.cross_totals || {}
  const allLicenses = stats?.all_licenses || []

  const maxTypeCount = Math.max(1, ...Object.values(byType))
  const maxDeptCount = Math.max(1, ...Object.values(byDepartment))

  const maxCrossValue = Math.max(
    1,
    ...crossMatrix.flatMap((row) => departments.map((d) => row[d] || 0)),
  )

  const yAxisTicks = useMemo(() => {
    const ticks = []
    const step = Math.ceil(maxCrossValue / 5) || 1
    for (let i = 0; i <= 5; i++) {
      ticks.push(i * step)
    }
    return ticks
  }, [maxCrossValue])

  const filteredLicenses = useMemo(() => {
    if (!filterType && !filterDept) return allLicenses
    return allLicenses.filter((item) => {
      if (filterType && item.license_type !== filterType) return false
      if (filterDept && item.owner_department !== filterDept) return false
      return true
    })
  }, [allLicenses, filterType, filterDept])

  const handleCellClick = (type, dept) => {
    setFilterType(type)
    setFilterDept(dept)
  }

  const isCellActive = (type, dept) => filterType === type && filterDept === dept

  const getTypeLabel = (value) => {
    const found = licenseTypes.find((t) => t.value === value)
    return found ? found.label : value
  }

  const typeColorMap = {
    business: '#2563eb',
    permit: '#16a34a',
    qualification: '#9333ea',
    tax: '#ca8a04',
    other: '#64748b',
  }

  return (
    <section className="page-stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">Statistics</p>
          <h1>证照到期统计</h1>
        </div>
      </div>

      <div className="metrics-grid">
        <MetricCard label="证照总数" value={stats?.total_licenses} />
        <MetricCard label="即将到期" value={stats?.expiring_licenses} tone="warning" />
        <MetricCard label="已到期" value={stats?.expired_licenses} tone="danger" />
        <MetricCard label="借出中" value={stats?.borrowed_records} />
      </div>

      <div className="content-grid two-col">
        <div className="panel">
          <div className="panel-title">
            <PieChart size={18} />
            <h2>按类型统计</h2>
          </div>
          <div className="bar-list">
            {licenseTypes.map((type) => {
              const value = byType[type.value] || 0
              return (
                <div className="bar-row" key={type.value}>
                  <div>
                    <span>{type.label}</span>
                    <strong>{value}</strong>
                  </div>
                  <div className="bar-track">
                    <span
                      style={{
                        width: `${(value / maxTypeCount) * 100}%`,
                        background: typeColorMap[type.value],
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">
            <BarChart3 size={18} />
            <h2>按部门统计</h2>
          </div>
          {departments.length ? (
            <div className="bar-list">
              {departments.map((dept) => {
                const value = byDepartment[dept] || 0
                return (
                  <div className="bar-row" key={dept}>
                    <div>
                      <span>{dept}</span>
                      <strong>{value}</strong>
                    </div>
                    <div className="bar-track">
                      <span style={{ width: `${(value / maxDeptCount) * 100}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState title="暂无部门数据" description="当前没有部门数据。" />
          )}
        </div>
      </div>

      <div className="panel">
        <div className="panel-title cross-title">
          <div className="cross-title-left">
            <Table2 size={18} />
            <h2>证照类型 × 部门 交叉分析</h2>
          </div>
          <div className="view-switcher">
            <button
              className={`switch-btn ${crossView === 'chart' ? 'active' : ''}`}
              onClick={() => setCrossView('chart')}
            >
              <BarChart3 size={14} />
              图表
            </button>
            <button
              className={`switch-btn ${crossView === 'detail' ? 'active' : ''}`}
              onClick={() => setCrossView('detail')}
            >
              <List size={14} />
              明细
            </button>
          </div>
        </div>

        {crossView === 'chart' ? (
          departments.length ? (
            <div className="cross-chart">
              <div className="cross-chart-body">
                <div className="cross-y-axis">
                  {[...yAxisTicks].reverse().map((tick) => (
                    <div className="y-tick" key={tick}>
                      <span className="y-tick-label">{tick}</span>
                      <span className="y-grid-line" />
                    </div>
                  ))}
                </div>
                <div className="cross-chart-cols">
                  {departments.map((dept) => (
                    <div className="cross-chart-col" key={dept}>
                      <div className="cross-bars">
                        {crossMatrix.map((row) => {
                          const value = row[dept] || 0
                          const heightPct = (value / maxCrossValue) * 100
                          return (
                            <div className="cross-bar-wrap" key={row.license_type}>
                              <div
                                className="cross-bar"
                                style={{
                                  height: `${Math.max(heightPct, value > 0 ? 4 : 0)}%`,
                                  background: typeColorMap[row.license_type] || '#64748b',
                                }}
                                title={`${getTypeLabel(row.license_type)}: ${value}`}
                              >
                                {value > 0 && <span>{value}</span>}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      <div className="cross-chart-label">{dept}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="cross-legend">
                {licenseTypes.map((type) => (
                  <div className="legend-item" key={type.value}>
                    <span
                      className="legend-dot"
                      style={{ background: typeColorMap[type.value] }}
                    />
                    <span>{type.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState title="暂无数据" description="当前没有证照数据可供交叉分析。" />
          )
        ) : allLicenses.length ? (
          <div className="cross-detail">
            <div className="cross-table-wrap">
              <table className="cross-table">
                <thead>
                  <tr>
                    <th>证照类型 \ 部门</th>
                    {departments.map((d) => (
                      <th key={d}>{d}</th>
                    ))}
                    <th className="total-col">合计</th>
                  </tr>
                </thead>
                <tbody>
                  {crossMatrix.map((row) => (
                    <tr key={row.license_type}>
                      <td className="type-cell">{getTypeLabel(row.license_type)}</td>
                      {departments.map((d) => {
                        const value = row[d] || 0
                        const active = isCellActive(row.license_type, d)
                        return (
                          <td
                            key={d}
                            className={`cell-btn ${active ? 'cell-active' : ''}`}
                            onClick={() => handleCellClick(row.license_type, d)}
                          >
                            {value}
                          </td>
                        )
                      })}
                      <td
                        className={`total-cell cell-btn ${filterType === row.license_type && !filterDept ? 'cell-active' : ''}`}
                        onClick={() => handleCellClick(row.license_type, null)}
                      >
                        {row.total || 0}
                      </td>
                    </tr>
                  ))}
                  <tr className="total-row">
                    <td className="type-cell">合计</td>
                    {departments.map((d) => {
                      const active = filterDept === d && !filterType
                      return (
                        <td
                          key={d}
                          className={`cell-btn ${active ? 'cell-active' : ''}`}
                          onClick={() => handleCellClick(null, d)}
                        >
                          {crossTotals[d] || 0}
                        </td>
                      )
                    })}
                    <td
                      className={`total-cell cell-btn ${!filterType && !filterDept ? 'cell-active' : ''}`}
                      onClick={() => handleCellClick(null, null)}
                    >
                      {crossTotals.total || 0}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="license-detail-header">
              <div className="license-detail-title">
                证照清单（共 {filteredLicenses.length} 条）
              </div>
              {(filterType || filterDept) && (
                <button
                  className="ghost-button clear-filter-btn"
                  onClick={() => handleCellClick(null, null)}
                >
                  清除筛选
                </button>
              )}
            </div>
            {filteredLicenses.length ? (
              <div className="record-list license-detail-list">
                {filteredLicenses.map((item) => (
                  <div className="record-row license-detail-row" key={item.id}>
                    <div>
                      <strong>{item.name}</strong>
                      <span>
                        {item.license_no} · {getTypeLabel(item.license_type)}
                      </span>
                    </div>
                    <div>
                      <span style={{ marginTop: 0 }}>{item.owner_department}</span>
                      <span>保管人：{item.keeper || '-'}</span>
                    </div>
                    <div className="row-right">
                      <StatusBadge status={item.computed_status || item.status} />
                      <span>到期：{item.expiry_date}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="无匹配证照" description="当前筛选条件下没有证照。" />
            )}
          </div>
        ) : (
          <EmptyState title="暂无明细数据" description="当前没有证照明细。" />
        )}
      </div>
    </section>
  )
}
