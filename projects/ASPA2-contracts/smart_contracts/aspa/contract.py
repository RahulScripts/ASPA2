from algopy import *
from algopy.arc4 import abimethod


class DigitalMarketplace(ARC4Contract):
    asset_id: UInt64
    price_per_unit: UInt64

    @abimethod(allow_actions=["NoOp"], create="require")
    def create_app(self, asset: Asset, price: UInt64) -> None:
        """Initialize the contract with an asset and price per unit."""
        self.asset_id = asset.id
        self.price_per_unit = price

    @abimethod()
    def update_price(self, new_price: UInt64) -> None:
        """Allows the creator to update the price of the asset."""
        assert (
            Txn.sender == Global.creator_address
        ), "Only the creator can update the price."
        self.price_per_unit = new_price

    @abimethod()
    def opt_in_asset(self, deposit: gtxn.PaymentTransaction) -> None:
        """Opt-in the contract to the asset, ensuring required minimum balance."""
        assert Txn.sender == Global.creator_address, "Only the creator can opt-in."
        assert not Global.current_application_address.is_opted_in(
            Asset(self.asset_id)
        ), "Already opted-in."
        assert (
            deposit.receiver == Global.current_application_address
        ), "Funds must go to contract."
        assert (
            deposit.amount == Global.min_balance + Global.asset_opt_in_min_balance
        ), "Incorrect deposit amount."

        itxn.AssetTransfer(
            xfer_asset=self.asset_id,
            asset_receiver=Global.current_application_address,
            asset_amount=0,
        ).submit()

    @abimethod()
    def purchase(self, payment: gtxn.PaymentTransaction, amount: UInt64) -> None:
        """Allows users to buy the asset by sending the correct payment."""
        assert payment.sender == Txn.sender, "Sender mismatch."
        assert (
            payment.receiver == Global.current_application_address
        ), "Payment must go to contract."
        assert (
            payment.amount == self.price_per_unit * amount
        ), "Incorrect payment amount."

        itxn.AssetTransfer(
            xfer_asset=self.asset_id,
            asset_receiver=Txn.sender,
            asset_amount=amount,
        ).submit()

    @abimethod(allow_actions=["DeleteApplication"])
    def close_app(self) -> None:
        """Allows the creator to delete the contract and reclaim assets."""
        assert (
            Txn.sender == Global.creator_address
        ), "Only the creator can delete the contract."

        itxn.AssetTransfer(
            xfer_asset=self.asset_id,
            asset_receiver=Global.creator_address,
            asset_amount=0,
            asset_close_to=Global.creator_address,
            fee=1_000,
        ).submit()

        itxn.Payment(
            receiver=Global.creator_address,
            amount=0,
            close_remainder_to=Global.creator_address,
            fee=1_000,
        ).submit()
