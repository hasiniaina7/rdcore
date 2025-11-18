import type { ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { UsageFilters } from '../types';

interface Props {
  filters: UsageFilters;
  onChange: (next: UsageFilters) => void;
  routerOptions: string[];
  macOptions: string[];
}

export default function UsageFilterBar({ filters, onChange, routerOptions, macOptions }: Props) {
  const { t } = useTranslation();
  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    let nextValue: string | number | undefined = value;
    if (name === 'minMegabytes') {
      nextValue = value === '' ? undefined : Number(value);
    } else if (value === '') {
      nextValue = undefined;
    }
    onChange({ ...filters, [name]: nextValue } as UsageFilters);
  };

  return (
    <div className="cp-filter-bar" role="search" aria-label={t('success.filters.ariaLabel')}>
      <div className="cp-filter">
        <label htmlFor="filter-start">{t('success.filters.start')}</label>
        <input id="filter-start" type="date" name="startDate" value={filters.startDate ?? ''} onChange={handleChange} />
      </div>
      <div className="cp-filter">
        <label htmlFor="filter-end">{t('success.filters.end')}</label>
        <input id="filter-end" type="date" name="endDate" value={filters.endDate ?? ''} onChange={handleChange} />
      </div>
      <div className="cp-filter">
        <label htmlFor="filter-router">{t('success.filters.router')}</label>
        <select id="filter-router" name="router" value={filters.router ?? ''} onChange={handleChange}>
          <option value="">{t('success.filters.routerAll')}</option>
          {routerOptions.map((router) => (
            <option key={router} value={router}>
              {router}
            </option>
          ))}
        </select>
      </div>
      <div className="cp-filter">
        <label htmlFor="filter-device">{t('success.filters.device')}</label>
        <select id="filter-device" name="deviceMac" value={filters.deviceMac ?? ''} onChange={handleChange}>
          <option value="">{t('success.filters.deviceAll')}</option>
          {macOptions.map((mac) => (
            <option key={mac} value={mac}>
              {mac}
            </option>
          ))}
        </select>
      </div>
      <div className="cp-filter">
        <label htmlFor="filter-min">{t('success.filters.min')}</label>
        <input
          id="filter-min"
          name="minMegabytes"
          type="number"
          min="0"
          placeholder="0"
          value={filters.minMegabytes ?? ''}
          onChange={handleChange}
        />
      </div>
      <div className="cp-filter">
        <label htmlFor="filter-status">{t('success.filters.status')}</label>
        <select id="filter-status" name="status" value={filters.status ?? 'all'} onChange={handleChange}>
          <option value="all">{t('success.filters.statusAll')}</option>
          <option value="active">{t('success.filters.statusActive')}</option>
          <option value="inactive">{t('success.filters.statusInactive')}</option>
        </select>
      </div>
    </div>
  );
}
