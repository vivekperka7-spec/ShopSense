import Transaction from "../models/transaction.js";
import Product from "../models/product.js";

// Content-based recommendation: look at the categories the customer has
// bought from before, then suggest other products in those categories they
// haven't already bought. Falls back to overall best-sellers for customers
// with no purchase history. Not a collaborative-filtering model - a
// straightforward Milestone 2 starting point.
export const recommendationsForCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;

    const pastTxns = await Transaction.find({ customerId, status: "Completed" }).populate("productId");
    const purchasedProductIds = pastTxns.map((t) => String(t.productId?._id));
    const purchasedCategories = [...new Set(pastTxns.map((t) => t.productId?.category).filter(Boolean))];

    let recommendations = [];

    if (purchasedCategories.length > 0) {
      recommendations = await Product.find({
        category: { $in: purchasedCategories },
        _id: { $nin: purchasedProductIds }
      }).limit(6).populate("vendorId", "businessName");
    }

    if (recommendations.length < 4) {
      const bestSellers = await Transaction.aggregate([
        { $match: { status: "Completed" } },
        { $group: { _id: "$productId", quantitySold: { $sum: "$quantity" } } },
        { $sort: { quantitySold: -1 } },
        { $limit: 10 }
      ]);
      const bestSellerIds = bestSellers
        .map((b) => String(b._id))
        .filter((id) => !purchasedProductIds.includes(id));

      const fallbackProducts = await Product.find({ _id: { $in: bestSellerIds } })
        .populate("vendorId", "businessName");

      const existingIds = new Set(recommendations.map((p) => String(p._id)));
      for (const p of fallbackProducts) {
        if (!existingIds.has(String(p._id))) recommendations.push(p);
        if (recommendations.length >= 6) break;
      }
    }

    res.json({
      customerId,
      basedOnCategories: purchasedCategories,
      basedOnOrders: pastTxns.length,
      recommendations
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
