import { BehaviorSubject, Unsubscribable } from 'rxjs';
import { first, switchMap } from 'rxjs/operators';
import { ApiRx } from '@polkadot/api';
import { BalanceOf, Permill, BlockNumber } from '@polkadot/types/interfaces';
import { DeriveBalancesAccount } from '@polkadot/api-derive/types';
import { formatAddressShort } from 'helpers';
import {
  ISubstrateTreasuryProposal,
  SubstrateCoin
} from 'adapters/chain/substrate/types';
import { ProposalModule } from 'models';
import { SubstrateTypes } from '@commonwealth/chain-events';
import SubstrateChain from './shared';
import SubstrateAccounts, { SubstrateAccount } from './account';
import { SubstrateTreasuryProposal } from './treasury_proposal';
import { stringToU8a, u8aToHex } from '@polkadot/util';

class SubstrateTreasury extends ProposalModule<
  ApiRx,
  ISubstrateTreasuryProposal,
  SubstrateTreasuryProposal
> {
  // TODO: understand Pot behavior
  private _pot = new BehaviorSubject<SubstrateCoin>(null);
  get pot() { return this._pot.value; }

  // The minimum bond for a proposal
  private _bondMinimum: SubstrateCoin = null;
  get bondMinimum() { return this._bondMinimum; }

  // The percentage of a proposal value that will be bonded
  private _bondPct: number = null;
  get bondPct() { return this._bondPct; }

  // The percentage of treasury funds that are burnt every spend period, if left unspent
  private _burnPct: number = null;
  get burnPct() { return this._burnPct; }

  // How often (in blocks) spend periods occur
  private _spendPeriod: number = null;
  get spendPeriod() { return this._spendPeriod; }

  get nextSpendBlock(): number {
    return (Math.floor(this.app.chain.block.height / this.spendPeriod) + 1) * this.spendPeriod;
  }

  public computeBond(amount: SubstrateCoin): SubstrateCoin {
    const computed = amount.muln(this.bondPct);
    return this.bondMinimum.gt(computed) ? this.bondMinimum : this._Chain.coins(computed);
  }

  private _potSubscription: Unsubscribable;
  public deinit() {
    if (this._potSubscription) {
      this._potSubscription.unsubscribe();
    }
    super.deinit();
  }

  private _Chain: SubstrateChain;
  private _Accounts: SubstrateAccounts;

  public init(ChainInfo: SubstrateChain, Accounts: SubstrateAccounts): Promise<void> {
    this._Chain = ChainInfo;
    this._Accounts = Accounts;
    return new Promise((resolve, reject) => {
      this._Chain.api.pipe(first()).subscribe((api: ApiRx) => {
        // save parameters
        this._bondPct = +(api.consts.treasury.proposalBond as Permill) / 1_000_000;
        this._bondMinimum = this._Chain.coins(api.consts.treasury.proposalBondMinimum as BalanceOf);
        this._spendPeriod = +(api.consts.treasury.spendPeriod as BlockNumber);
        this._burnPct = +(api.consts.treasury.burn as Permill) / 1_000_000;

        const entities = this.app.chain.chainEntities.store.getByType(SubstrateTypes.EntityKind.TreasuryProposal);
        const constructorFunc = (e) => new SubstrateTreasuryProposal(this._Chain, this._Accounts, this, e);
        const proposals = entities.map((e) => this._entityConstructor(constructorFunc, e));
        const TREASURY_ACCOUNT = u8aToHex(stringToU8a('modlpy/trsry'.padEnd(32, '\0')));

        new Promise((innerResolve) => {
          this._potSubscription = this._Chain.api.pipe(
            switchMap((api: ApiRx) => api.derive.balances.account(TREASURY_ACCOUNT)
          )).subscribe((pot: DeriveBalancesAccount) => {
            this._pot.next(this._Chain.coins(pot.freeBalance));
            innerResolve();
          });
        }).then(() => {
          this._initialized = true;
          resolve();
        }).catch((err) => {
          reject(err);
        });
      });
    });
  }

  public createTx(author: SubstrateAccount, value: SubstrateCoin, beneficiary: SubstrateAccount) {
    return this._Chain.createTXModalData(
      author,
      (api: ApiRx) => api.tx.treasury.proposeSpend(value, beneficiary.address),
      'proposeSpend',
      `proposeSpend(${value.format()}, ${formatAddressShort(beneficiary.address, beneficiary.chain.id)})`
    );
  }
}

export default SubstrateTreasury;
