import React from 'react';
import isEqual from 'lodash/isEqual';
import GraffyContext from './GraffyContext';

const { useRef, useState, useEffect, useContext, useCallback } = React;

const consumeSubscription = async (subscription, setState) => {
  try {
    for await (const data of subscription) {
      if (subscription.closed) {
        // console.warn('Ignoring update after subscription has closed.');
        break;
      }

      setState((prevState) => ({
        ...prevState,
        loading: false,
        data,
        error: null,
      }));
    }
  } catch (error) {
    // console.error('Error reading stream in useQuery', e);
    setState((prevState) => ({
      ...prevState,
      loading: false,
      data: null,
      error,
    }));
  }
};

const retrieveResult = async (promise, setState) => {
  try {
    const data = await promise;
    setState((prevState) => ({
      ...prevState,
      loading: false,
      data,
      error: null,
    }));
  } catch (error) {
    // console.error('Error fetching result in useQuery', e);
    setState((prevState) => ({
      ...prevState,
      loading: false,
      data: null,
      error,
    }));
  }
};

export default function useQuery(query, { once, ...options } = {}) {
  const queryRef = useRef(null);

  const fetchData = () => {
    if (state.loading !== true) setState({ ...state, loading: true });
    if (once) {
      retrieveResult(store.read(query, options), setState);
    } else {
      const subscription = store.watch(query, options);
      consumeSubscription(subscription, setState);

      return () => {
        subscription.closed = true;
        subscription.return();
      };
    }
  };

  const reload = useCallback(fetchData, []);
  const [state, setState] = useState({ reload });
  const store = useContext(GraffyContext);

  const queryHasChanged = !isEqual(queryRef.current, query);
  if (queryHasChanged) {
    // console.log('Query changed', debug(queryRef.current), debug(query));
    queryRef.current = query;
  }

  useEffect(fetchData, [queryHasChanged ? query : queryRef.current]);

  return queryHasChanged ? { ...state, loading: true } : state;
}
