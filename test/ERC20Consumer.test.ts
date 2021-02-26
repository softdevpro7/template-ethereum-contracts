import {expect} from './chai-setup';
import {ethers, deployments, getUnnamedAccounts} from 'hardhat';
import {ERC20Consumer, ERC20TransferGateway, IERC20} from '../typechain';
import {setupUsers} from './utils';

const setup = deployments.createFixture(async () => {
  await deployments.fixture('ERC20Consumer');
  const contracts = {
    ERC20Consumer: <ERC20Consumer>await ethers.getContract('ERC20Consumer'),
    ERC20TransferGateway: <ERC20TransferGateway>(
      await ethers.getContract('ERC20TransferGateway')
    ),
    ERC20Token: <IERC20>await ethers.getContract('ERC20Token'),
  };
  const users = await setupUsers(await getUnnamedAccounts(), contracts);
  return {
    ...contracts,
    users,
  };
});

describe('ERC20Consumer', function () {
  it('calling it directly without pre-approval result in Allowance error', async function () {
    const {users} = await setup();
    await expect(users[0].ERC20Consumer.purchase(1)).to.be.revertedWith(
      'NOT_ENOUGH_ALLOWANCE'
    );
  });

  it('calling it via erc20transfer gateway works', async function () {
    const {ERC20Consumer, ERC20Token, users} = await setup();
    const {data, to} = <{data: string; to: string}>(
      await ERC20Consumer.populateTransaction.purchase(1)
    );
    await users[0].ERC20TransferGateway.transferERC20AndCall(
      ERC20Token.address,
      '500000000000000000',
      to,
      data
    );
  });

  it('calling it via erc20transfer gateway but with wrong amount fails', async function () {
    const {ERC20Consumer, ERC20Token, users} = await setup();
    const {data, to} = <{data: string; to: string}>(
      await ERC20Consumer.populateTransaction.purchase(1)
    );
    await expect(
      users[0].ERC20TransferGateway.transferERC20AndCall(
        ERC20Token.address,
        '400000000000000000',
        to,
        data
      )
    ).to.be.revertedWith('UNEXPECTED_AMOUNT');
  });
});
