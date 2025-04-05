from algopy import *
from algopy.arc4 import abimethod


class DigitalMarketplace(ARC4Contract):
    asset_id: UInt64
    price_per_unit: UInt64
    seller_name: String  # Store seller name for better identification
    product_name: String  # Store product name for better identification
    min_order_quantity: UInt64  # Minimum order quantity

    @abimethod(allow_actions=["NoOp"], create="require")
    def create_app(
        self,
        asset: Asset,
        price: UInt64,
        seller: String,
        product: String,
    ) -> None:
        """Initialize the marketplace with an agricultural product and price per unit."""
        self.asset_id = asset.id
        self.price_per_unit = price
        self.seller_name = seller
        self.product_name = product

    @abimethod()
    def update_price(self, new_price: UInt64) -> None:
        """Allows the owner to update the price of the product."""
        assert (
            Txn.sender == Global.creator_address
        ), "Only the marketplace owner can update the price."
        self.price_per_unit = new_price

    @abimethod()
    def update_min_quantity(self, new_min_quantity: UInt64) -> None:
        """Allows the owner to update the minimum order quantity."""
        assert (
            Txn.sender == Global.creator_address
        ), "Only the marketplace owner can update the minimum quantity."
        self.min_order_quantity = new_min_quantity

    @abimethod()
    def setup_marketplace(self, deposit: gtxn.PaymentTransaction) -> None:
        """Sets up the marketplace with necessary funding and registers to receive products."""
        assert (
            Txn.sender == Global.creator_address
        ), "Only the marketplace owner can set up."
        assert not Global.current_application_address.is_opted_in(
            Asset(self.asset_id)
        ), "Already registered for this product."
        assert (
            deposit.receiver == Global.current_application_address
        ), "Funds must go to marketplace."
        assert (
            deposit.amount >= Global.min_balance + Global.asset_opt_in_min_balance
        ), "Insufficient setup funds."

        # Automatically register the marketplace to receive the product
        itxn.AssetTransfer(
            xfer_asset=self.asset_id,
            asset_receiver=Global.current_application_address,
            asset_amount=0,
        ).submit()

    @abimethod()
    def help_buyer_register(self, buyer: gtxn.PaymentTransaction) -> None:
        """Helps a buyer register to receive the product if they haven't already."""
        assert (
            buyer.receiver == Global.current_application_address
        ), "Payment must go to marketplace."
        assert (
            buyer.amount >= Global.asset_opt_in_min_balance
        ), "Insufficient funds for registration."

        # Send the registration transaction on behalf of the buyer
        itxn.AssetTransfer(
            xfer_asset=self.asset_id,
            asset_receiver=buyer.sender,
            asset_amount=0,
        ).submit()

        # Return any excess funds
        remaining = buyer.amount - Global.asset_opt_in_min_balance
        if remaining > 0:
            itxn.Payment(
                receiver=buyer.sender,
                amount=remaining,
            ).submit()

    @abimethod()
    def purchase(self, payment: gtxn.PaymentTransaction, amount: UInt64) -> None:
        """Allows users to buy the product by sending the correct payment."""
        assert payment.sender == Txn.sender, "Sender mismatch."
        assert (
            payment.receiver == Global.current_application_address
        ), "Payment must go to marketplace."
        assert amount >= self.min_order_quantity, "Order below minimum quantity."
        assert (
            payment.amount == self.price_per_unit * amount
        ), "Incorrect payment amount."

        # Check if buyer is registered to receive the product
        if not Txn.sender.is_opted_in(Asset(self.asset_id)):
            # Cannot complete purchase if not registered and no extra funds provided
            assert (
                False
            ), "You must register to receive this product first. Use help_buyer_register or buy_with_registration."

        # Check if contract has enough of the asset
        contract_balance, exists = op.AssetHoldingGet.asset_balance(
            Global.current_application_address, Asset(self.asset_id)
        )

        assert exists, "Contract is not opted into this asset"

        assert contract_balance >= amount, "Not enough product available in stock."

        # Transfer the product to the buyer
        itxn.AssetTransfer(
            xfer_asset=self.asset_id,
            asset_receiver=Txn.sender,
            asset_amount=amount,
        ).submit()

    @abimethod()
    def buy_with_registration(
        self, payment: gtxn.PaymentTransaction, amount: UInt64
    ) -> None:
        """Allows users to buy the product with automatic registration if needed."""
        assert payment.sender == Txn.sender, "Sender mismatch."
        assert (
            payment.receiver == Global.current_application_address
        ), "Payment must go to marketplace."
        assert amount >= self.min_order_quantity, "Order below minimum quantity."

        # Calculate required amount including registration fee if needed
        required_amount = self.price_per_unit * amount

        # Check if contract has enough of the asset
        contract_balance, exists = op.AssetHoldingGet.asset_balance(
            Global.current_application_address, Asset(self.asset_id)
        )
        assert exists, "Contract is not opted into this asset"

        assert contract_balance >= amount, "Not enough product available in stock."

        # Check if buyer is already registered to receive the product
        if not Txn.sender.is_opted_in(Asset(self.asset_id)):
            required_amount += Global.asset_opt_in_min_balance

            assert (
                payment.amount >= required_amount
            ), "Insufficient payment amount. Additional funds needed for product registration."

            # Register the buyer to receive the product
            itxn.AssetTransfer(
                xfer_asset=self.asset_id,
                asset_receiver=Txn.sender,
                asset_amount=0,
            ).submit()
        else:
            assert payment.amount >= required_amount, "Insufficient payment amount."

        # Transfer the product to the buyer
        itxn.AssetTransfer(
            xfer_asset=self.asset_id,
            asset_receiver=Txn.sender,
            asset_amount=amount,
        ).submit()

        # Return any excess payment
        excess = payment.amount - required_amount
        if excess > 0:
            itxn.Payment(
                receiver=Txn.sender,
                amount=excess,
            ).submit()

    @abimethod()
    def restock_product(self, asset_txn: gtxn.AssetTransferTransaction) -> None:
        """Allows the owner to restock the product."""
        assert (
            Txn.sender == Global.creator_address
        ), "Only the marketplace owner can restock."
        assert (
            asset_txn.xfer_asset.id == self.asset_id
        ), "Wrong asset being transferred."
        assert (
            asset_txn.asset_receiver == Global.current_application_address
        ), "Asset must be sent to marketplace."
        assert asset_txn.asset_amount > 0, "Cannot restock with zero amount."

    @abimethod(allow_actions=["DeleteApplication"])
    def close_marketplace(self) -> None:
        """Allows the owner to close the marketplace and reclaim assets."""
        assert (
            Txn.sender == Global.creator_address
        ), "Only the marketplace owner can close the marketplace."

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
