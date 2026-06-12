data "azurerm_subscription" "current" {}

resource "azurerm_consumption_budget_subscription" "budget" {
  name            = "budget-sre-demo"
  subscription_id = data.azurerm_subscription.current.id
  amount          = 190
  time_grain      = "Monthly"

  time_period {
    start_date = "2026-06-01T00:00:00Z"
    end_date   = "2027-06-01T00:00:00Z"
  }

  notification {
    enabled        = true
    threshold      = 90.0
    operator       = "EqualTo"
    threshold_type = "Actual"

    contact_emails = [
      "sre@example.com",
    ]
  }
}
