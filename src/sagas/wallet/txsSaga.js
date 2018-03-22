import { all, takeLatest, call, put, fork, select, take, race } from 'redux-saga/effects';
import { delay } from 'redux-saga';
import { get } from '../../utils/fetch';
import { fetchTxs, START_TXS_POLLING, END_TXS_POLLING } from '../../redux/modules/wallet/txs';


function* fetchTxsIterator({ payload }) {
  try {
    const data = yield call(get, `/dashboard/transactions?walletAddress=${payload}`);
    yield put(fetchTxs.success(data));
  } catch (e) {
    yield put(fetchTxs.failure(e));
  }
}

function* fetchTxsSaga() {
  yield takeLatest(
    fetchTxs.REQUEST,
    fetchTxsIterator
  );
}


const getSelectedWallet = (state) => state.wallet.selectedWallet;

function* poolTxsIterator() {
  while (true) {
    try {
      yield call(delay, 10000);
      const selectedWallet = yield select(getSelectedWallet);
      const data = yield call(get, `/dashboard/transactions?walletAddress=${selectedWallet}`);
      yield put(fetchTxs.success(data));
    } catch (e) {
      yield call(console.log, e);
    }
  }
}

function* poolTxsSaga() {
  while (true) {
    yield take(START_TXS_POLLING);
    yield race([
      call(poolTxsIterator),
      take(END_TXS_POLLING)
    ]);
  }
}


export default function* () {
  yield all([
    fork(fetchTxsSaga),
    fork(poolTxsSaga)
  ]);
}
