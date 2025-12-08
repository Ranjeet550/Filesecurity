import { useState, useMemo } from 'react';
import { CaretUpOutlined, CaretDownOutlined, BarsOutlined } from '@ant-design/icons';
import { Popover, Input } from 'antd';

/**
 * Custom hook for table sorting functionality
 * @param {Array} data - The data array to sort
 * @param {Object} config - Configuration object with column keys and their sort functions
 * @returns {Object} - Returns sorted data and sorting controls
 */
export const useTableSort = (data, config = {}) => {
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: null, // 'asc', 'desc', or null
  });

  const [searchConfig, setSearchConfig] = useState({});

  const setSearchTerm = (key, term) => {
    setSearchConfig(prev => ({ ...prev, [key]: term }));
  };

  const getSearchTerm = (key) => searchConfig[key] || '';

  const sortedData = useMemo(() => {
    // First, filter based on search
    let filteredData = data;
    Object.entries(searchConfig).forEach(([key, term]) => {
      if (term && term.trim()) {
        const searchLower = term.toLowerCase();
        filteredData = filteredData.filter(row => {
          const value = getNestedValue(row, key);
          return String(value || '').toLowerCase().includes(searchLower);
        });
      }
    });

    // Then sort
    if (!sortConfig.key || !sortConfig.direction) {
      return filteredData;
    }

    const sortableData = [...filteredData];
    const sortFunction = config[sortConfig.key];

    sortableData.sort((a, b) => {
      let aValue, bValue;

      if (sortFunction && typeof sortFunction === 'function') {
        // Use custom sort function if provided
        const result = sortFunction(a, b);
        return sortConfig.direction === 'asc' ? result : -result;
      } else {
        // Default sorting logic
        aValue = getNestedValue(a, sortConfig.key);
        bValue = getNestedValue(b, sortConfig.key);

        // Handle null/undefined values
        if (aValue == null) return 1;
        if (bValue == null) return -1;

        // String comparison
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
          return sortConfig.direction === 'asc' ? comparison : -comparison;
        }

        // Number comparison
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }

        // Date comparison
        if (aValue instanceof Date && bValue instanceof Date) {
          return sortConfig.direction === 'asc'
            ? aValue.getTime() - bValue.getTime()
            : bValue.getTime() - aValue.getTime();
        }

        // Default comparison
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      }
    });

    return sortableData;
  }, [data, sortConfig, config, searchConfig]);

  const requestSort = (key) => {
    let direction = 'asc';
    
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'asc') {
        direction = 'desc';
      } else if (sortConfig.direction === 'desc') {
        direction = null;
        key = null;
      }
    }

    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return null;
    }

    if (sortConfig.direction === 'asc') {
      return <CaretUpOutlined style={{ color: '#1890ff', marginLeft: 4 }} />;
    }

    if (sortConfig.direction === 'desc') {
      return <CaretDownOutlined style={{ color: '#1890ff', marginLeft: 4 }} />;
    }

    return null;
  };

  const resetSort = () => {
    setSortConfig({ key: null, direction: null });
  };

  return {
    sortedData,
    sortConfig,
    requestSort,
    getSortIcon,
    resetSort,
    setSearchTerm,
    getSearchTerm,
  };
};

/**
 * Helper function to get nested object values using dot notation
 * @param {Object} obj - The object to extract value from
 * @param {String} path - The path to the value (e.g., 'user.name')
 * @returns {*} - The value at the path
 */
const getNestedValue = (obj, path) => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

/**
 * Sortable column header component
 * @param {Object} props - Component props
 * @param {String} props.columnKey - The key of the column to sort
 * @param {String} props.label - The display label for the column
 * @param {Function} props.onSort - Callback function when sort is requested
 * @param {Function} props.getSortIcon - Function to get the sort icon
 * @param {Function} props.setSearchTerm - Function to set search term
 * @param {Function} props.getSearchTerm - Function to get search term
 * @param {Object} props.style - Additional styles for the header
 */
export const SortableHeader = ({ columnKey, label, onSort, getSortIcon, setSearchTerm, getSearchTerm, style = {} }) => {
  const searchContent = (
    <Input
      placeholder="Search column..."
      value={getSearchTerm(columnKey)}
      onChange={(e) => setSearchTerm(columnKey, e.target.value)}
      style={{ width: 200 }}
      size="small"
      allowClear
    />
  );

  return (
    <div
      onClick={() => onSort(columnKey)}
      style={{
        cursor: 'pointer',
        userSelect: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        ...style,
      }}
    >
      {label}
      {getSortIcon(columnKey)}
      <Popover content={searchContent} trigger="click" placement="bottomRight">
        <BarsOutlined style={{ marginLeft: 4, cursor: 'pointer', color: 'rgba(0, 0, 0, 0.69)', fontSize: '14px' }} />
      </Popover>
    </div>
  );
};

export default useTableSort;
