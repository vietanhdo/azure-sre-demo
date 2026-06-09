package telemetry

import (
	"context"
	"log/slog"
	"os"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlpmetric/otlpmetricgrpc"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
	"go.opentelemetry.io/otel/propagation"
	sdkmetric "go.opentelemetry.io/otel/sdk/metric"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.24.0"
)

// InitTelemetry initializes OpenTelemetry tracing and metrics
func InitTelemetry(ctx context.Context, serviceName, version string) (func(context.Context) error, error) {
	// If no OTLP endpoint is configured, just use a no-op setup
	if os.Getenv("OTEL_EXPORTER_OTLP_ENDPOINT") == "" {
		slog.Info("OTEL_EXPORTER_OTLP_ENDPOINT not set, skipping OpenTelemetry initialization")
		return func(context.Context) error { return nil }, nil
	}

	res, err := resource.New(ctx,
		resource.WithAttributes(
			semconv.ServiceNameKey.String(serviceName),
			semconv.ServiceVersionKey.String(version),
			semconv.DeploymentEnvironmentKey.String(os.Getenv("ENVIRONMENT")),
		),
	)
	if err != nil {
		return nil, err
	}

	// 1. Setup Tracing
	traceExporter, err := otlptracegrpc.New(ctx)
	if err != nil {
		return nil, err
	}
	bsp := sdktrace.NewBatchSpanProcessor(traceExporter)
	tracerProvider := sdktrace.NewTracerProvider(
		sdktrace.WithSampler(sdktrace.AlwaysSample()),
		sdktrace.WithResource(res),
		sdktrace.WithSpanProcessor(bsp),
	)
	otel.SetTracerProvider(tracerProvider)

	// 2. Setup Metrics
	metricExporter, err := otlpmetricgrpc.New(ctx)
	if err != nil {
		return nil, err
	}
	meterProvider := sdkmetric.NewMeterProvider(
		sdkmetric.WithReader(sdkmetric.NewPeriodicReader(metricExporter)),
		sdkmetric.WithResource(res),
	)
	otel.SetMeterProvider(meterProvider)

	// 3. Setup Propagation
	otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
		propagation.TraceContext{},
		propagation.Baggage{},
	))

	slog.Info("OpenTelemetry initialized successfully")

	shutdownFunc := func(ctx context.Context) error {
		var err error
		if tErr := tracerProvider.Shutdown(ctx); tErr != nil {
			err = tErr
		}
		if mErr := meterProvider.Shutdown(ctx); mErr != nil {
			err = mErr
		}
		return err
	}

	return shutdownFunc, nil
}
