import IdStore from './IdStore';
import { OffchainComment } from '../models';
import { byAscendingCreationDate } from '../helpers';
import { IUniqueId } from '../models/interfaces';

class CommentsStore extends IdStore<OffchainComment<any>> {
  private _storeAuthor: { [address: string]: Array<OffchainComment<any>> } = {};

  private _storeProposal: { [identifier: string]: Array<OffchainComment<any>> } = {};

  public add(comment: OffchainComment<any>) {
    // TODO: Remove this once we start enforcing an ordering in stores
    super.add(comment);
    this.getAll().sort(byAscendingCreationDate);
    if (!this._storeAuthor[comment.author]) {
      this._storeAuthor[comment.author] = [];
    }
    this._storeAuthor[comment.author].push(comment);
    this._storeAuthor[comment.author].sort(byAscendingCreationDate);
    if (!this._storeProposal[comment.rootProposal]) {
      this._storeProposal[comment.rootProposal] = [];
    }
    this._storeProposal[comment.rootProposal].push(comment);
    this._storeProposal[comment.rootProposal].sort(byAscendingCreationDate);
    return this;
  }

  public remove(comment: OffchainComment<any>) {
    super.remove(comment);

    const authorIndex = this._storeAuthor[comment.author].indexOf(comment);
    if (authorIndex === -1) {
      throw new Error('Comment not in authors store');
    }
    this._storeAuthor[comment.author].splice(authorIndex, 1);

    const proposalIndex = this._storeProposal[comment.proposal.uniqueIdentifier].indexOf(comment);
    if (comment.proposal && proposalIndex === -1) {
      throw new Error('Comment not in proposals store');
    }
    this._storeProposal[comment.proposal.uniqueIdentifier].splice(proposalIndex, 1);
    return this;
  }

  public clear() {
    super.clear();
    this._storeAuthor = {};
    this._storeProposal = {};
  }

  public clearProposal<T extends IUniqueId>(proposal: T) {
    if (this._storeProposal[proposal.uniqueIdentifier]) {
      const comments = this._storeProposal[proposal.uniqueIdentifier].slice();
      comments.map(this.remove.bind(this));
      delete this._storeProposal[proposal.uniqueIdentifier];
    }
    return this;
  }

  public getById(id: number): OffchainComment<any> {
    return this._store.find((c) => c.id === id);
  }

  public getByAuthor(address: string): Array<OffchainComment<any>> {
    return this._storeAuthor[address] || [];
  }

  public getByProposal<T extends IUniqueId>(proposal: T): Array<OffchainComment<any>> {
    return this._storeProposal[proposal.uniqueIdentifier] || [];
  }

  public nComments<T extends IUniqueId>(proposal: T): number {
    if (this._storeProposal[proposal.uniqueIdentifier]) {
      return this._storeProposal[proposal.uniqueIdentifier].length;
    } else {
      return 0;
    }
  }
}

export default CommentsStore;
