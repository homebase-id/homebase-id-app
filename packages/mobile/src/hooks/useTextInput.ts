import { useCallback, useState } from 'react';
import { debounce } from 'lodash';

export const useTextInput = (initialValue: string = '') => {
    const [query, setQuery] = useState(initialValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedSetQuery = useCallback(
        debounce((q) => setQuery(q), 300),
        []
    );
    return {
        query,
        setQuery: debouncedSetQuery,
    };
};
