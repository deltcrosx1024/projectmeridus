'use client';

import { SWRConfig } from 'swr';

export const SWRProvider = ({ children }: { children: React.ReactNode }) => {
    return (
        <SWRConfig
            value={{
                fetcher: (resource: string, init?: RequestInit) =>
                    fetch(resource, init).then((res) => res.json()),
                // Other global settings
                revalidateOnFocus: false,
                refreshInterval: 3000, 
            }}
        >
            {children}  
        </SWRConfig>
    );
}