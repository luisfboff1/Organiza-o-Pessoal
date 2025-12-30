'use client';

import { useQuery } from '@tanstack/react-query';
import { getChartData } from '../actions/get-chart-data';

export function useChartData(workspaceId: string, dataSource: string, queryConfig: any) {
  const chartDataQuery = useQuery({
    queryKey: ['chart-data', workspaceId, dataSource, queryConfig],
    queryFn: () => getChartData(workspaceId, dataSource, queryConfig),
    enabled: !!dataSource,
  });

  return {
    data: chartDataQuery.data || [],
    isLoading: chartDataQuery.isLoading,
  };
}
