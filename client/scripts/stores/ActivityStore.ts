import { AddressInfo, OffchainThread } from '../models';
import { byAscendingCreationDate } from '../helpers';

interface IRecentActivity {
  postCount: number;
  addressInfo: AddressInfo;
}

class RecentActivityStore {
  private _threadsByCommunity: { [identifier: string]: Array<OffchainThread> } = {};
  private _addressesByCommunity: { [identifier: string]: any } = {};

  public addThread(thread: OffchainThread) {
    const parentEntity = thread.community || thread.chain;
    if (!this._threadsByCommunity[parentEntity]) {
      this._threadsByCommunity[parentEntity] = [];
    }
    this._threadsByCommunity[parentEntity].push(thread);
    this._threadsByCommunity[parentEntity].sort(byAscendingCreationDate);
    return this;
  }

  public removeThread(thread: OffchainThread) {
    const parentEntity = thread.community || thread.chain;
    const communityStore = this._threadsByCommunity[parentEntity];
    const matchingthread = communityStore.filter((t) => t.id === thread.id)[0];
    const proposalIndex = communityStore.indexOf(matchingthread);
    if (proposalIndex === -1) {
      throw new Error('thread not in store');
    }
    communityStore.splice(proposalIndex, 1);
    return this;
  }

  public addAddress(address: any, parentEntity: string) {
    const { id, chain } = address;
    const communityStore = this._addressesByCommunity[parentEntity];
    if (!communityStore) {
      this._addressesByCommunity[parentEntity] = [];
    }
    if (!communityStore[id]) {
      const addressInfo = new AddressInfo(id, address, chain, null);
      const postCount = 1;
      communityStore[id] = { addressInfo, postCount };
    } else {
      communityStore[id]['postCount'] += 1;
    }
    communityStore.sort(byAscendingCreationDate);
    return this;
  }

  public removeAddress(address: AddressInfo, parentEntity: string) {
    const communityStore = this._addressesByCommunity[parentEntity];
    const matchingthread = communityStore.filter((t) => t.id === address.id)[0];
    const proposalIndex = communityStore.indexOf(matchingthread);
    if (proposalIndex === -1) {
      throw new Error('thread not in store');
    }
    communityStore.splice(proposalIndex, 1);
    return this;
  }

  public clearThreads() {
    this._threadsByCommunity = {};
  }

  public clearAddresses() {
    this._addressesByCommunity = {};
  }

  public getThreadsByCommunity(communityId): Array<OffchainThread> {
    return this._threadsByCommunity[communityId] || [];
  }

  public getAddressesByCommunity(communityId): Array<AddressInfo> {
    return this._addressesByCommunity[communityId] || [];
  }
}

export default RecentActivityStore;
