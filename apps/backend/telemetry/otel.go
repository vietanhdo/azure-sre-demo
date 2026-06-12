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

	var traceExporter sdktrace.SpanExporter
	var metricExporter sdkmetric.Exporter

	if os.Getenv("OTEL_EXPORTER_OTLP_ENDPOINT") != "" {
		traceExporter, err = otlptracegrpc.New(ctx)
		if err != nil {
			return nil, err
		}
		metricExporter, err = otlpmetricgrpc.New(ctx)
		if err != nil {
			return nil, err
		}
	}

	// 1. Setup Tracing
	tracerProviderOptions := []sdktrace.TracerProviderOption{
		sdktrace.WithSampler(sdktrace.AlwaysSample()),
		sdktrace.WithResource(res),
	}
	if traceExporter != nil {
		bsp := sdktrace.NewBatchSpanProcessor(traceExporter)
		tracerProviderOptions = append(tracerProviderOptions, sdktrace.WithSpanProcessor(bsp))
	}
	tracerProvider := sdktrace.NewTracerProvider(tracerProviderOptions...)
	otel.SetTracerProvider(tracerProvider)

	// 2. Setup Metrics
	var meterProvider *sdkmetric.MeterProvider
	if metricExporter != nil {
		meterProvider = sdkmetric.NewMeterProvider(
			sdkmetric.WithReader(sdkmetric.NewPeriodicReader(metricExporter)),
			sdkmetric.WithResource(res),
		)
		otel.SetMeterProvider(meterProvider)
	}

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
		if meterProvider != nil {
			if mErr := meterProvider.Shutdown(ctx); mErr != nil {
				err = mErr
			}
		}
		return err
	}

	return shutdownFunc, nil
}
